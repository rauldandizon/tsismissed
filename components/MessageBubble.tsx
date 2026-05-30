"use client";

import { useState } from "react";
import { Phone, Video } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import type { Message } from "@/types/message";
import type { CallType } from "@/lib/callProvider";
import { ImageViewer } from "@/components/ImageViewer";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherUid: string;
  onJoinCall?: (callUrl: string, callType: CallType) => void;
}

function formatTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  try {
    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function CallIcon({ callType }: { callType: CallType }) {
  return callType === "audio" ? (
    <Phone size={14} className="shrink-0" />
  ) : (
    <Video size={14} className="shrink-0" />
  );
}

export function MessageBubble({ message, isOwn, otherUid, onJoinCall }: MessageBubbleProps) {
  const time = formatTime(message.createdAt);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (message.type === "call") {
    const callType = message.callType ?? "audio";
    const label = callType === "audio" ? "Voice Call" : "Video Call";

    if (isOwn) {
      return (
        <div className="flex flex-col items-end mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl rounded-br-sm bg-tsismis-surface border border-tsismis-purple/50 text-tsismis-text text-sm">
            <CallIcon callType={callType} />
            <span className="font-semibold text-tsismis-pink">{label}</span>
          </div>
          {time && (
            <span className="text-[10px] text-tsismis-hint mt-1 px-1 font-medium">{time}</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-tsismis-surface border border-tsismis-purple/50 text-tsismis-text text-sm">
          <CallIcon callType={callType} />
          <span className="font-semibold text-tsismis-muted">{label}</span>
          {message.callUrl && onJoinCall && (
            <button
              onClick={() => onJoinCall(message.callUrl!, callType)}
              className="ml-2.5 px-4 py-1 text-xs font-semibold bg-transparent border border-tsismis-pink text-tsismis-pink rounded-full hover:bg-tsismis-pink/10 transition-all active:scale-[0.97] cursor-pointer"
            >
              Sumali sa tawag
            </button>
          )}
        </div>
        {time && (
          <span className="text-[10px] text-tsismis-hint mt-1 px-1 font-medium">{time}</span>
        )}
      </div>
    );
  }

  // Image message
  if (message.type === "image") {
    const isSeen = message.readBy?.includes(otherUid) ?? false;
    const receipt = isSeen ? "Seen ✓" : "Sent";

    if (isOwn) {
      return (
        <div className="flex flex-col items-end mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <img
            src={message.mediaUrl}
            alt="Image"
            onClick={() => setViewerOpen(true)}
            className="max-w-[240px] rounded-xl border border-tsismis-border object-cover shadow-md shadow-tsismis-pink/5 cursor-pointer hover:opacity-90 transition-opacity"
          />
          <div className="flex items-center gap-1.5 mt-1 px-1 font-medium">
            {time && <span className="text-[10px] text-tsismis-hint">{time}</span>}
            <span className={`text-[10px] ${isSeen ? "text-tsismis-cyan" : "text-tsismis-hint"}`}>{receipt}</span>
          </div>
          {viewerOpen && <ImageViewer url={message.mediaUrl!} onClose={() => setViewerOpen(false)} />}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <img
          src={message.mediaUrl}
          alt="Image"
          onClick={() => setViewerOpen(true)}
          className="max-w-[240px] rounded-xl border border-tsismis-border object-cover shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
        />
        {time && <span className="text-[10px] text-tsismis-hint mt-1 px-1 font-medium">{time}</span>}
        {viewerOpen && <ImageViewer url={message.mediaUrl!} onClose={() => setViewerOpen(false)} />}
      </div>
    );
  }

  // Audio message
  if (message.type === "audio") {
    const isSeen = message.readBy?.includes(otherUid) ?? false;
    const receipt = isSeen ? "Seen ✓" : "Sent";

    if (isOwn) {
      return (
        <div className="flex flex-col items-end mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="max-w-[240px] px-3 py-2 rounded-2xl rounded-br-sm bg-bubble-gradient shadow-md shadow-tsismis-pink/5">
            <audio controls src={message.mediaUrl} className="w-full max-w-[216px]" />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1 font-medium">
            {time && <span className="text-[10px] text-tsismis-hint">{time}</span>}
            <span className={`text-[10px] ${isSeen ? "text-tsismis-cyan" : "text-tsismis-hint"}`}>{receipt}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="max-w-[240px] px-3 py-2 rounded-2xl rounded-bl-sm bg-tsismis-surface border border-tsismis-border shadow-sm">
          <audio controls src={message.mediaUrl} className="w-full max-w-[216px]" />
        </div>
        {time && <span className="text-[10px] text-tsismis-hint mt-1 px-1 font-medium">{time}</span>}
      </div>
    );
  }

  // Text message
  const isSeen = message.readBy?.includes(otherUid) ?? false;
  const receipt = isSeen ? "Seen ✓" : "Sent";

  if (isOwn) {
    return (
      <div className="flex flex-col items-end mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-bubble-gradient text-white text-sm leading-relaxed shadow-md shadow-tsismis-pink/5">
          {message.text}
        </div>
        <div className="flex items-center gap-1.5 mt-1 px-1 font-medium">
          {time && (
            <span className="text-[10px] text-tsismis-hint">{time}</span>
          )}
          <span className={`text-[10px] ${isSeen ? "text-tsismis-cyan" : "text-tsismis-hint"}`}>{receipt}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="max-w-[70%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-tsismis-surface border border-tsismis-border text-tsismis-text text-sm leading-relaxed shadow-sm">
        {message.text}
      </div>
      {time && (
        <span className="text-[10px] text-tsismis-hint mt-1 px-1 font-medium">{time}</span>
      )}
    </div>
  );
}
