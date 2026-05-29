"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/messages";

interface MessageInputProps {
  conversationId: string;
  senderId: string;
  receiverId: string;
}

export function MessageInput({
  conversationId,
  senderId,
  receiverId,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    try {
      await sendMessage(conversationId, senderId, receiverId, trimmed);
      setText("");
      textareaRef.current?.focus();
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-tsismis-border bg-tsismis-sidebar p-4 transition-all duration-150">
      {error && (
        <p className="text-xs text-red-400 mb-2 font-medium">{error}</p>
      )}
      <div className="flex items-end gap-2.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mag-type ng tsismis..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-tsismis-border bg-tsismis-surface px-4 py-2.5 text-sm text-tsismis-text placeholder:text-tsismis-hint outline-none focus:border-tsismis-pink focus:ring-1 focus:ring-tsismis-pink/30 transition-all max-h-32 overflow-y-auto"
          style={{ lineHeight: "1.5" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full bg-tsismis-gradient text-white hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-tsismis-pink/10"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
