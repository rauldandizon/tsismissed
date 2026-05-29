"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search, X } from "lucide-react";
import { ThemeLogo } from "@/components/ThemeLogo";
import { useAuth } from "@/components/AuthProvider";
import { UserAvatar } from "@/components/UserAvatar";
import { ContactSearch } from "@/components/ContactSearch";
import { ConversationList } from "@/components/ConversationList";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { CallDialog } from "@/components/CallDialog";
import { IncomingCallToast } from "@/components/IncomingCallToast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { subscribeContacts } from "@/lib/contacts";
import {
  getOrCreateConversation,
  subscribeConversations,
} from "@/lib/conversations";
import { getUserDoc } from "@/lib/firestore";
import { signOut } from "@/lib/auth";
import { createRoomName, buildCallUrl } from "@/lib/callProvider";
import { sendCallMessage } from "@/lib/calls";
import type { Contact } from "@/types/contact";
import type { Conversation } from "@/types/conversation";
import type { CallState } from "@/types/call";
import type { CallType } from "@/lib/callProvider";

export function ChatLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [foreignContacts, setForeignContacts] = useState<Contact[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [callState, setCallState] = useState<CallState | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeContacts(user.uid, setContacts);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return subscribeConversations(user.uid, setConversations);
  }, [user?.uid]);

  // Fetch profiles for conversation participants not already in the contact list
  useEffect(() => {
    if (!user) return;

    const contactUidSet = new Set(contacts.map((c) => c.uid));
    const foreignUids = [
      ...new Set(
        conversations
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

  async function handleSelectContact(contact: Contact) {
    if (!user) return;
    const conversation = await getOrCreateConversation(user.uid, contact.uid);
    setSelectedConversationId(conversation.id);
    setSelectedContact(contact);
    setMobileView("chat");
  }

  async function handleStartCall(callType: CallType) {
    if (!user || !selectedConversationId || !selectedContact) return;
    const roomName = createRoomName(selectedConversationId, callType);
    const callUrl = buildCallUrl(roomName, callType);
    await sendCallMessage(
      selectedConversationId,
      user.uid,
      selectedContact.uid,
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
    });
  }

  function handleJoinCall(callUrl: string, callType: CallType) {
    setCallState({
      open: true,
      mode: "receiver",
      callType,
      callUrl,
      roomName: "",
      conversationId: selectedConversationId ?? "",
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

  if (!user) return null;

  const conversationMap = new Map(conversations.map((c) => [c.id, c]));
  const contactUids = new Set(contacts.map((c) => c.uid));
  const allContacts = [
    ...contacts,
    ...foreignContacts.filter((fc) => !contactUids.has(fc.uid)),
  ];
  const isSearching = searchTerm.trim().length > 0;
  const conversationIds = conversations.map((c) => c.id);

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
        <div className="flex-1 overflow-y-auto bg-tsismis-sidebar py-2">
          {isSearching ? (
            <ContactSearch
              term={searchTerm}
              currentUid={user.uid}
              contactUids={contactUids}
            />
          ) : (
            <ConversationList
              contacts={allContacts}
              conversationMap={conversationMap}
              selectedConversationId={selectedConversationId}
              currentUid={user.uid}
              onSelect={handleSelectContact}
            />
          )}
        </div>

        {/* Sidebar profile footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-tsismis-border bg-gradient-to-b from-tsismis-sidebar to-tsismis-surface/30 shrink-0">
          {/* Left — Avatar + Name + Online badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <UserAvatar
                displayName={user.displayName ?? ""}
                photoURL={user.photoURL ?? ""}
                size={36}
              />
              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tsismis-cyan border-2 border-tsismis-sidebar" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-tsismis-text truncate leading-tight">
                {user.displayName ?? "User"}
              </span>
              <span className="text-[10px] font-medium text-tsismis-cyan leading-tight tracking-wide">
                Online
              </span>
            </div>
          </div>
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
        {selectedConversationId && selectedContact ? (
          <>
            <ChatHeader
              contact={selectedContact}
              onBack={handleBack}
              onStartCall={handleStartCall}
            />
            <MessageList
              conversationId={selectedConversationId}
              currentUid={user.uid}
              otherUid={selectedContact.uid}
              onJoinCall={handleJoinCall}
            />
            <MessageInput
              conversationId={selectedConversationId}
              senderId={user.uid}
              receiverId={selectedContact.uid}
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
        />
      )}

      {/* Incoming call toasts */}
      <IncomingCallToast
        conversationIds={conversationIds}
        currentUid={user.uid}
        onJoinCall={handleJoinCall}
      />
    </div>
  );
}
