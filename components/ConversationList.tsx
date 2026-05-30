"use client";

import { Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getConversationId } from "@/lib/conversations";
import type { Contact } from "@/types/contact";
import type { Conversation } from "@/types/conversation";
import type { Timestamp } from "firebase/firestore";

interface ConversationListProps {
  contacts: Contact[];
  conversationMap: Map<string, Conversation>;
  selectedConversationId: string | null;
  currentUid: string;
  onSelect: (contact: Contact) => void;
  loading?: boolean;
}

function formatPreviewTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function ConversationSkeleton() {
  return (
    <ul className="space-y-0.5 py-2">
      {[120, 90, 150, 80, 110].map((w, i) => (
        <li key={i} className="flex items-center gap-3 p-3 mx-2 my-0.5">
          <div className="w-10 h-10 rounded-full bg-tsismis-border/40 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className={`h-3 rounded bg-tsismis-border/40 animate-pulse`} style={{ width: w }} />
            <div className="h-2.5 rounded bg-tsismis-border/30 animate-pulse w-[60px]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ConversationList({
  contacts,
  conversationMap,
  selectedConversationId,
  currentUid,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return <ConversationSkeleton />;
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center select-none">
        <Sparkles size={40} className="text-tsismis-hint mb-3 animate-pulse duration-1000" />
        <p className="text-sm font-semibold text-tsismis-muted">No tsismis yet!</p>
        <p className="text-xs text-tsismis-hint mt-1 max-w-[200px]">
          Search for friends above to start the chika.
        </p>
      </div>
    );
  }

  const sorted = [...contacts].sort((a, b) => {
    const convA = conversationMap.get(getConversationId(currentUid, a.uid));
    const convB = conversationMap.get(getConversationId(currentUid, b.uid));
    const aTime =
      convA?.lastMessageAt?.toMillis() ??
      convA?.createdAt?.toMillis() ??
      a.addedAt?.toMillis() ??
      Date.now();
    const bTime =
      convB?.lastMessageAt?.toMillis() ??
      convB?.createdAt?.toMillis() ??
      b.addedAt?.toMillis() ??
      Date.now();
    return bTime - aTime;
  });

  return (
    <ul className="space-y-0.5">
      {sorted.map((contact) => {
        const conversationId = getConversationId(currentUid, contact.uid);
        const conversation = conversationMap.get(conversationId);
        const isSelected = selectedConversationId === conversationId;

        const lastMessage = conversation?.lastMessage?.trim() || null;

        const previewTime = formatPreviewTime(conversation?.lastMessageAt);
        const unreadCount = conversation?.unreadFor?.[currentUid] ?? 0;

        return (
          <li
            key={contact.uid}
            onClick={() => onSelect(contact)}
            className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-150 rounded-xl mx-2 my-0.5 border ${
              isSelected
                ? "bg-active-item border-l-[3px] border-l-tsismis-pink border-y-transparent border-r-transparent"
                : "hover:bg-white/5 border-transparent hover:border-tsismis-border"
            }`}
          >
            <UserAvatar
              displayName={contact.displayName}
              photoURL={contact.photoURL}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-1">
                <p className={`text-sm truncate ${unreadCount > 0 ? "font-bold text-tsismis-text" : "font-semibold text-tsismis-text"}`}>
                  {contact.displayName}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-tsismis-gradient text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {previewTime && (
                    <span className={`text-[10px] font-medium ${unreadCount > 0 ? "text-tsismis-pink" : "text-tsismis-hint"}`}>
                      {previewTime}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs truncate mt-0.5">
                {lastMessage ? (
                  <span className={unreadCount > 0 ? "text-tsismis-text font-medium" : "text-tsismis-muted"}>
                    {lastMessage}
                  </span>
                ) : (
                  <span className="text-tsismis-hint italic">Say hi!</span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
