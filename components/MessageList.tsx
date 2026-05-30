"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { MessageBubble } from "@/components/MessageBubble";
import { subscribeMessages, markMessagesAsRead } from "@/lib/messages";
import type { Message } from "@/types/message";
import type { CallType } from "@/lib/callProvider";

interface MessageListProps {
  conversationId: string;
  currentUid: string;
  otherUid: string;
  contactName?: string;
  isTyping?: boolean;
  onJoinCall?: (callUrl: string, callType: CallType, messageId: string) => void;
}

export function MessageList({
  conversationId,
  currentUid,
  otherUid,
  contactName,
  isTyping,
  onJoinCall,
}: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setMessages([]);

    const unsub = subscribeMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return unsub;
  }, [conversationId]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    markMessagesAsRead(conversationId, messages, currentUid).catch(() => {});
  }, [messages, conversationId, currentUid]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-tsismis-bg">
        {[
          { side: "right", width: "60%" },
          { side: "left",  width: "45%" },
          { side: "right", width: "70%" },
          { side: "left",  width: "35%" },
        ].map((s, i) => (
          <div key={i} className={`flex ${s.side === "right" ? "justify-end" : "justify-start"}`}>
            <div
              className={`h-10 rounded-2xl animate-pulse bg-tsismis-border/40 ${s.side === "right" ? "rounded-br-sm" : "rounded-bl-sm"}`}
              style={{ width: s.width }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-tsismis-bg select-none animate-in fade-in duration-300">
        <MessageSquare size={40} className="text-tsismis-hint mb-3" />
        <p className="text-sm font-semibold text-tsismis-muted">Start the tsismis!</p>
        <p className="text-xs text-tsismis-hint mt-1">Say hi and get the chika going.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-tsismis-bg">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === currentUid}
          otherUid={otherUid}
          onJoinCall={onJoinCall}
          onMediaLoad={scrollToBottom}
        />
      ))}
      {isTyping && (
        <div className="flex items-center gap-2 px-1 py-1 animate-in fade-in duration-200">
          <div className="flex gap-1 items-center bg-tsismis-surface border border-tsismis-border rounded-2xl rounded-bl-sm px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tsismis-muted animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-tsismis-muted animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-tsismis-muted animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-[10px] text-tsismis-hint italic">
            {contactName ?? "Someone"} is typing…
          </span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
