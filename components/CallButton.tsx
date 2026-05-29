"use client";

import { Phone, Video } from "lucide-react";
import type { CallType } from "@/lib/callProvider";

interface CallButtonProps {
  callType: CallType;
  onClick: (callType: CallType) => void;
  disabled?: boolean;
}

export function CallButton({ callType, onClick, disabled }: CallButtonProps) {
  return (
    <button
      onClick={() => onClick(callType)}
      disabled={disabled}
      title={callType === "audio" ? "Start audio call" : "Start video call"}
      className="h-8 w-8 flex items-center justify-center rounded-full bg-transparent text-tsismis-muted hover:text-tsismis-text hover:bg-white/5 transition-all active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
    >
      {callType === "audio" ? <Phone size={18} /> : <Video size={18} />}
    </button>
  );
}
