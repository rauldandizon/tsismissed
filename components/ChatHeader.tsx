"use client";

import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { CallButton } from "@/components/CallButton";
import type { Contact } from "@/types/contact";
import type { CallType } from "@/lib/callProvider";

interface ChatHeaderProps {
  contact: Contact;
  onBack: () => void;
  onStartCall: (callType: CallType) => void;
}

export function ChatHeader({ contact, onBack, onStartCall }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 h-16 border-b border-tsismis-border bg-tsismis-sidebar shrink-0">
      <button
        onClick={onBack}
        className="md:hidden p-1.5 -ml-1 rounded-full text-tsismis-muted hover:text-tsismis-text hover:bg-white/5 transition-all active:scale-[0.9]"
        aria-label="Back to contacts"
      >
        <ArrowLeft size={20} />
      </button>
      <UserAvatar
        displayName={contact.displayName}
        photoURL={contact.photoURL}
        size={36}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-tsismis-text truncate">
          {contact.displayName}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <CallButton callType="audio" onClick={onStartCall} />
        <CallButton callType="video" onClick={onStartCall} />
      </div>
    </div>
  );
}
