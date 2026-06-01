"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LogOut, Search, X, Plus } from "lucide-react";
import { ThemeLogo } from "@/components/ThemeLogo";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";
import { ContactSearch } from "@/components/ContactSearch";
import { ConversationList } from "@/components/ConversationList";
import { ContactRequestsPanel } from "@/components/ContactRequestsPanel";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
const CallDialog = dynamic(
  () => import("@/components/CallDialog").then((m) => ({ default: m.CallDialog })),
  { ssr: false }
);
import { IncomingCallToast } from "@/components/IncomingCallToast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EditProfilePanel } from "@/components/EditProfilePanel";
import { ContactProfileModal } from "@/components/ContactProfileModal";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { GroupInfoModal } from "@/components/GroupInfoModal";
import { subscribeContacts } from "@/lib/contacts";
import {
  getOrCreateConversation,
  createGroupConversation,
  updateGroupAvatar,
  leaveGroup,
  subscribeConversations,
} from "@/lib/conversations";
import { getUserDoc } from "@/lib/firestore";
import { signOut } from "@/lib/auth";
import { createRoomName, buildCallUrl } from "@/lib/callProvider";
import { sendCallMessage } from "@/lib/calls";
import {
  subscribeIncomingRequests,
  acceptContactRequest,
  declineContactRequest,
} from "@/lib/contactRequests";
import {
  blockUser,
  unblockUser,
  subscribeBlockedUsers,
  subscribeBlockedByUsers,
} from "@/lib/blockedUsers";
import type { Contact } from "@/types/contact";
import type { Conversation } from "@/types/conversation";
import type { ContactRequest } from "@/types/contactRequest";
import type { CallState } from "@/types/call";
import type { CallType } from "@/lib/callProvider";
import type { UserProfile } from "@/types/user";

export function ChatLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [foreignContacts, setForeignContacts] = useState<Contact[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Conversation | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<
    Map<string, UserProfile>
  >(new Map());
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [callState, setCallState] = useState<CallState | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [contactProfileContact, setContactProfileContact] = useState<Contact | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  // Session 7 — contact requests + block
  const [pendingRequests, setPendingRequests] = useState<ContactRequest[]>([]);
  const [blockedUids, setBlockedUids] = useState<Set<string>>(new Set());
  const [blockedByUids, setBlockedByUids] = useState<Set<string>>(new Set());

  const allBlockedUids = useMemo(
    () => new Set([...blockedUids, ...blockedByUids]),
    [blockedUids, blockedByUids]
  );

  useEffect(() => {
    if (!user) return;
    return subscribeContacts(user.uid, (c) => {
      setContacts(c);
      setContactsLoading(false);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return subscribeConversations(user.uid, setConversations);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return subscribeIncomingRequests(user.uid, setPendingRequests);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return subscribeBlockedUsers(user.uid, setBlockedUids);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return subscribeBlockedByUsers(user.uid, setBlockedByUids);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    getUserDoc(user.uid).then(setUserProfile);
  }, [user?.uid]);

  // Fetch profiles for conversation participants not already in the contact list
  useEffect(() => {
    if (!user) return;

    const contactUidSet = new Set(contacts.map((c) => c.uid));
    const foreignUids = [
      ...new Set(
        conversations
          // Only direct conversations surface a counterpart in the sidebar.
          // Group members must not become phantom direct-chat rows.
          .filter((conv) => conv.type !== "group")
          .flatMap((conv) => conv.participantIds)
          .filter((uid) => uid !== user.uid && !contactUidSet.has(uid))
      ),
    ];

    if (foreignUids.length === 0) {
      setForeignContacts([]);
      return;
    }

    Promise.all(foreignUids.map((uid) => getUserDoc(uid)))
      .then((profiles) => {
        const synthetic: Contact[] = profiles
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .map((p) => ({
            uid: p.uid,
            displayName: p.displayName,
            email: p.email,
            photoURL: p.photoURL,
            bio: p.bio,
            addedAt: p.createdAt,
          }));
        setForeignContacts(synthetic);
      })
      .catch(() => {});
  }, [conversations, contacts, user?.uid]);

  // Stable key for the open group's membership — re-fetch profiles only when it changes
  const openGroupConv = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId) ?? selectedGroup
    : null;
  const groupMembersKey =
    openGroupConv?.type === "group" ? openGroupConv.participantIds.join(",") : "";

  // Fetch member profiles for the open group (sender names, member list, typing)
  useEffect(() => {
    if (!user || !groupMembersKey) {
      setParticipantProfiles(new Map());
      return;
    }
    let cancelled = false;
    const uids = groupMembersKey.split(",");
    Promise.all(uids.map((uid) => getUserDoc(uid)))
      .then((profiles) => {
        if (cancelled) return;
        const map = new Map<string, UserProfile>();
        for (const p of profiles) {
          if (p) map.set(p.uid, p);
        }
        setParticipantProfiles(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [groupMembersKey, user?.uid]);

  async function handleSelectContact(contact: Contact) {
    if (!user) return;
    const conversation = await getOrCreateConversation(user.uid, contact.uid);
    setSelectedGroup(null);
    setSelectedConversationId(conversation.id);
    setSelectedContact(contact);
    setMobileView("chat");
  }

  function handleSelectGroup(conversation: Conversation) {
    setSelectedGroup(conversation);
    setSelectedContact(null);
    setSelectedConversationId(conversation.id);
    setMobileView("chat");
  }

  async function handleCreateGroup(
    name: string,
    memberUids: string[],
    photoURL?: string,
    avatarPublicId?: string
  ) {
    if (!user) return;
    const conversation = await createGroupConversation(
      user.uid,
      memberUids,
      name,
      photoURL,
      avatarPublicId
    );
    setCreateGroupOpen(false);
    handleSelectGroup(conversation);
  }

  async function handleUpdateGroupAvatar(
    photoURL: string,
    avatarPublicId: string
  ) {
    if (!selectedConversationId) return;
    await updateGroupAvatar(selectedConversationId, photoURL, avatarPublicId);
    // Reflect immediately on the selected-group fallback object so the header
    // and modal update before the next snapshot lands.
    setSelectedGroup((prev) =>
      prev ? { ...prev, photoURL, avatarPublicId } : prev
    );
  }

  async function handleLeaveGroup() {
    if (!user || !selectedConversationId) return;
    await leaveGroup(selectedConversationId, user.uid);
    setGroupInfoOpen(false);
    setSelectedGroup(null);
    setSelectedContact(null);
    setSelectedConversationId(null);
    setMobileView("list");
  }

  async function handleStartCall(callType: CallType) {
    if (!user || !selectedConversationId) return;
    const conv = conversations.find((c) => c.id === selectedConversationId);
    const recipientIds = conv
      ? conv.participantIds.filter((u) => u !== user.uid)
      : selectedContact
      ? [selectedContact.uid]
      : [];
    if (recipientIds.length === 0) return;
    setEditProfileOpen(false);
    setGroupInfoOpen(false);
    const roomName = createRoomName(selectedConversationId, callType);
    const callUrl = buildCallUrl(roomName, callType);
    const messageId = await sendCallMessage(
      selectedConversationId,
      user.uid,
      recipientIds,
      callType,
      callUrl,
      roomName
    );
    setCallState({
      open: true,
      mode: "caller",
      callType,
      callUrl,
      roomName,
      conversationId: selectedConversationId,
      messageId,
    });
  }

  function handleJoinCall(callUrl: string, callType: CallType, messageId: string) {
    setCallState({
      open: true,
      mode: "receiver",
      callType,
      callUrl,
      roomName: "",
      conversationId: selectedConversationId ?? "",
      messageId,
    });
  }

  function handleCloseCall() {
    setCallState(null);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function handleBack() {
    setMobileView("list");
  }

  async function handleBlock(targetUid: string) {
    if (!user) return;
    await blockUser(user.uid, targetUid);
    if (selectedContact?.uid === targetUid) {
      setSelectedContact(null);
      setSelectedConversationId(null);
      setMobileView("list");
    }
  }

  async function handleUnblock(targetUid: string) {
    if (!user) return;
    await unblockUser(user.uid, targetUid);
  }

  async function handleAcceptRequest(request: ContactRequest) {
    if (!user) return;
    await acceptContactRequest(
      user.uid,
      {
        uid: user.uid,
        displayName: userProfile?.displayName ?? user.displayName ?? "",
        email: userProfile?.email ?? user.email ?? "",
        photoURL: userProfile?.photoURL ?? user.photoURL ?? "",
        bio: userProfile?.bio ?? "",
      },
      request
    );
  }

  async function handleDeclineRequest(request: ContactRequest) {
    if (!user) return;
    await declineContactRequest(user.uid, request.fromUid);
  }

  if (!user) return null;

  const conversationMap = new Map(conversations.map((c) => [c.id, c]));
  const contactUids = new Set(contacts.map((c) => c.uid));

  // Active conversation — prefer the live (subscribed) copy, fall back to the
  // just-selected group object so the panel renders before the snapshot lands.
  const activeConversation = selectedConversationId
    ? conversationMap.get(selectedConversationId) ?? selectedGroup ?? undefined
    : undefined;
  const activeIsGroup = activeConversation?.type === "group";

  // Everyone except the current user. Drives recipients and "Seen by all".
  const otherUids = activeConversation
    ? activeConversation.participantIds.filter((u) => u !== user.uid)
    : selectedContact
    ? [selectedContact.uid]
    : [];

  // Info map for sender identity in group bubbles. Seed from the names cached on
  // the conversation doc (instant, no fetch), then overlay the freshest live
  // profiles so renamed members update once their fetch lands.
  const participantsInfo = new Map<
    string,
    { displayName: string; photoURL?: string }
  >();
  if (activeConversation?.participantInfo) {
    for (const [uid, info] of Object.entries(activeConversation.participantInfo)) {
      participantsInfo.set(uid, {
        displayName: info.displayName,
        photoURL: info.photoURL,
      });
    }
  }
  for (const [uid, p] of participantProfiles) {
    participantsInfo.set(uid, { displayName: p.displayName, photoURL: p.photoURL });
  }

  // Typing indicator: first participant (not us) active within the last 5 seconds
  let isOtherTyping = false;
  let typingName: string | undefined;
  if (activeConversation?.typing) {
    const now = Date.now();
    for (const [uid, ts] of Object.entries(activeConversation.typing)) {
      if (uid === user.uid) continue;
      if (typeof ts === "number" && now - ts < 5000) {
        isOtherTyping = true;
        typingName = activeIsGroup
          ? participantsInfo.get(uid)?.displayName ?? "Someone"
          : selectedContact?.displayName;
        break;
      }
    }
  }

  const allContacts = [
    ...contacts,
    ...foreignContacts.filter((fc) => !contactUids.has(fc.uid)),
  ];

  // Filter out blocked users from conversation list
  const visibleContacts = allContacts.filter(
    (c) => !allBlockedUids.has(c.uid)
  );

  const isSearching = searchTerm.trim().length > 0;
  const conversationIds = conversations.map((c) => c.id);
  const selectedIsBlocked = selectedContact
    ? allBlockedUids.has(selectedContact.uid)
    : false;

  return (
    <div className="flex h-screen bg-tsismis-bg text-tsismis-text overflow-hidden transition-all duration-150">
      {/* Left sidebar */}
      <aside
        className={`flex-col w-full md:w-[300px] lg:w-[320px] border-r border-tsismis-border shrink-0 bg-tsismis-sidebar ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar header — brand logo only */}
        <div className="flex items-center px-4 h-16 border-b border-tsismis-border bg-gradient-to-b from-tsismis-surface to-tsismis-sidebar select-none shrink-0">
          <ThemeLogo variant="full" height={32} width={160} />
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-tsismis-border bg-tsismis-sidebar">
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-3.5 text-tsismis-hint pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hanapin ang ka-tsismis mo..."
              className="w-full pl-10 pr-8 py-2 text-sm bg-tsismis-sidebar border border-tsismis-border rounded-full text-tsismis-text placeholder:text-tsismis-hint outline-none focus:border-tsismis-pink/50 focus:ring-1 focus:ring-tsismis-pink/30 transition-all"
            />
            {isSearching && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 text-tsismis-hint hover:text-tsismis-muted transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Contact list or search results */}
        <div className="flex-1 overflow-y-auto bg-tsismis-sidebar">
          {isSearching ? (
            <div className="py-2">
              <ContactSearch
                term={searchTerm}
                currentUid={user.uid}
                currentDisplayName={user.displayName ?? ""}
                currentEmail={user.email ?? ""}
                currentPhotoURL={user.photoURL}
                contactUids={contactUids}
                onOpenChat={(uid) => {
                  const contact = allContacts.find((c) => c.uid === uid);
                  if (contact) {
                    setSearchTerm("");
                    handleSelectContact(contact);
                  }
                }}
              />
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <ContactRequestsPanel
                  requests={pendingRequests}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                />
              )}
              <div className="px-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setCreateGroupOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-tsismis-border text-sm font-semibold text-tsismis-muted hover:text-tsismis-text hover:border-tsismis-pink/50 hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus size={16} /> New Group
                </button>
              </div>
              <ConversationList
                contacts={visibleContacts}
                conversationMap={conversationMap}
                selectedConversationId={selectedConversationId}
                currentUid={user.uid}
                onSelect={handleSelectContact}
                onSelectGroup={handleSelectGroup}
                loading={contactsLoading}
              />
            </>
          )}
        </div>

        {/* Sidebar profile footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-tsismis-border bg-gradient-to-b from-tsismis-sidebar to-tsismis-surface/30 shrink-0">
          {/* Left — Avatar + Name + Online badge (clickable to edit profile) */}
          <button
            type="button"
            onClick={() => setEditProfileOpen(true)}
            title="Edit profile"
            aria-label="Edit profile"
            className="flex items-center gap-2.5 min-w-0 cursor-pointer rounded-xl px-2 py-1 -mx-2 -my-1 hover:bg-white/5 transition-colors duration-150 active:scale-[0.97] transition-transform"
          >
            <div className="relative shrink-0">
              <UserAvatar
                displayName={userProfile?.displayName ?? user.displayName ?? ""}
                photoURL={userProfile?.photoURL ?? user.photoURL ?? ""}
                size={36}
              />
              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tsismis-cyan border-2 border-tsismis-sidebar" />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-semibold text-tsismis-text truncate leading-tight">
                {userProfile?.displayName ?? user.displayName ?? "User"}
              </span>
              <span className="text-[10px] font-medium text-tsismis-cyan leading-tight tracking-wide">
                Online
              </span>
            </div>
          </button>
          {/* Right — Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="h-8 w-8 flex items-center justify-center rounded-full text-tsismis-muted hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition-all duration-200 active:scale-[0.9] cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Right area — chat panel */}
      <main
        className={`flex-1 flex-col bg-tsismis-bg ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedConversationId && (activeIsGroup || selectedContact) ? (
          <>
            {activeIsGroup ? (
              <ChatHeader
                group={{
                  name: activeConversation?.name ?? "Group",
                  memberCount: activeConversation?.participantIds.length ?? 0,
                  photoURL: activeConversation?.photoURL,
                }}
                onBack={handleBack}
                onStartCall={handleStartCall}
                onViewProfile={() => setGroupInfoOpen(true)}
              />
            ) : (
              <ChatHeader
                contact={selectedContact!}
                onBack={handleBack}
                onStartCall={handleStartCall}
                isBlocked={selectedIsBlocked}
                onBlock={() => handleBlock(selectedContact!.uid)}
                onUnblock={() => handleUnblock(selectedContact!.uid)}
                onViewProfile={() => setContactProfileContact(selectedContact)}
              />
            )}
            <MessageList
              conversationId={selectedConversationId}
              currentUid={user.uid}
              otherUids={otherUids}
              isGroup={activeIsGroup}
              participants={participantsInfo}
              typingName={typingName}
              isTyping={isOtherTyping}
              onJoinCall={handleJoinCall}
            />
            <MessageInput
              conversationId={selectedConversationId}
              senderId={user.uid}
              recipientIds={otherUids}
              disabled={!activeIsGroup && selectedIsBlocked}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-tsismis-bg text-center px-8">
            <div className="mb-4 opacity-80">
              <ThemeLogo variant="full" height={64} />
            </div>
            <h3 className="text-sm font-semibold text-tsismis-muted uppercase tracking-wider">Start the tsismis!</h3>
            <p className="text-xs text-tsismis-hint mt-1.5 max-w-xs leading-relaxed">
              Pumili ng ka-tsismis sa kaliwa para magsimula ng chika at tsismisan.
            </p>
          </div>
        )}
      </main>

      {/* Call dialog */}
      {callState && (
        <CallDialog
          open={callState.open}
          onClose={handleCloseCall}
          mode={callState.mode}
          callType={callState.callType}
          callUrl={callState.callUrl}
          conversationId={callState.conversationId}
          messageId={callState.messageId}
        />
      )}

      {/* Incoming call toasts */}
      <IncomingCallToast
        conversationIds={conversationIds}
        currentUid={user.uid}
        onJoinCall={handleJoinCall}
      />

      {/* Edit profile drawer */}
      {userProfile && editProfileOpen && (
        <EditProfilePanel
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          userProfile={userProfile}
          currentUserEmail={user.email ?? ""}
          onSaved={(updated) =>
            setUserProfile((prev) => (prev ? { ...prev, ...updated } : prev))
          }
        />
      )}

      {/* Contact profile modal */}
      {contactProfileContact && (
        <ContactProfileModal
          contact={contactProfileContact}
          onClose={() => setContactProfileContact(null)}
          onStartCall={handleStartCall}
          isBlocked={allBlockedUids.has(contactProfileContact.uid)}
          onBlock={() => {
            handleBlock(contactProfileContact.uid);
            setContactProfileContact(null);
          }}
          onUnblock={() => handleUnblock(contactProfileContact.uid)}
        />
      )}

      {/* Create group modal */}
      {createGroupOpen && (
        <CreateGroupModal
          contacts={visibleContacts}
          onClose={() => setCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Group info modal */}
      {groupInfoOpen && activeIsGroup && activeConversation && (
        <GroupInfoModal
          name={activeConversation.name ?? "Group"}
          photoURL={activeConversation.photoURL}
          members={activeConversation.participantIds.map((uid) => {
            const info = participantsInfo.get(uid);
            return {
              uid,
              displayName:
                uid === user.uid
                  ? userProfile?.displayName ?? user.displayName ?? "You"
                  : info?.displayName ?? "Member",
              photoURL: info?.photoURL,
            };
          })}
          currentUid={user.uid}
          onClose={() => setGroupInfoOpen(false)}
          onStartCall={handleStartCall}
          onLeave={handleLeaveGroup}
          onUpdateAvatar={handleUpdateGroupAvatar}
        />
      )}
    </div>
  );
}
