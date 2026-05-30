"use client";

import { useState } from "react";
import { X, Phone, Video, ShieldAlert, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import type { Contact } from "@/types/contact";
import type { CallType } from "@/lib/callProvider";

interface ContactProfileModalProps {
  contact: Contact;
  onClose: () => void;
  onStartCall: (callType: CallType) => void;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
}

export function ContactProfileModal({
  contact,
  onClose,
  onStartCall,
  isBlocked,
  onBlock,
  onUnblock,
}: ContactProfileModalProps) {
  const [confirmBlock, setConfirmBlock] = useState(false);

  function handleStartCall(callType: CallType) {
    onClose();
    onStartCall(callType);
  }

  function handleConfirmBlock() {
    setConfirmBlock(false);
    onBlock();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[300px] mx-4 bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient banner with close button */}
        <div className="relative h-20 bg-gradient-tsismis rounded-t-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-2.5 right-2.5 h-7 w-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
          {/* Avatar — overlaps banner bottom */}
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2">
            <div className="ring-4 ring-tsismis-surface rounded-full">
              <UserAvatar
                displayName={contact.displayName}
                photoURL={contact.photoURL}
                size={72}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="pt-12 pb-5 px-5 flex flex-col items-center">
          {/* Name */}
          <p className="text-base font-bold text-tsismis-text text-center leading-tight">
            {contact.displayName}
          </p>

          {/* Blocked badge */}
          {isBlocked && (
            <span className="mt-1.5 bg-red-500/10 text-red-400 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              Blocked
            </span>
          )}

          {/* Bio */}
          {contact.bio && (
            <p className="mt-2 text-sm text-tsismis-muted text-center leading-relaxed">
              {contact.bio}
            </p>
          )}

          {/* Call action buttons */}
          <div className="flex gap-2.5 w-full mt-5">
            <button
              type="button"
              disabled={isBlocked}
              onClick={() => handleStartCall("audio")}
              className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl bg-tsismis-bg border border-tsismis-border hover:border-tsismis-pink/40 hover:bg-tsismis-pink/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Phone size={18} className="text-tsismis-pink" />
              <span className="text-[11px] font-medium text-tsismis-muted">Audio</span>
            </button>
            <button
              type="button"
              disabled={isBlocked}
              onClick={() => handleStartCall("video")}
              className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-xl bg-tsismis-bg border border-tsismis-border hover:border-tsismis-pink/40 hover:bg-tsismis-pink/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Video size={18} className="text-tsismis-pink" />
              <span className="text-[11px] font-medium text-tsismis-muted">Video</span>
            </button>
          </div>

          {/* Block / Unblock */}
          <div className="w-full border-t border-tsismis-border mt-4 pt-3">
            <button
              type="button"
              onClick={isBlocked ? onUnblock : () => setConfirmBlock(true)}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97] cursor-pointer ${
                isBlocked
                  ? "text-[#2DC653] hover:text-[#2DC653]/80"
                  : "text-red-400 hover:text-red-300"
              }`}
            >
              {isBlocked
                ? <><ShieldCheck size={14} /> Unblock</>
                : <><ShieldAlert size={14} /> Block</>}
            </button>
          </div>
        </div>
      </div>

      {/* Block confirmation dialog */}
      {confirmBlock && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-2xl p-6 w-[320px] mx-4 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-tsismis-text">
                  Block {contact.displayName}?
                </p>
                <p className="text-xs text-tsismis-muted mt-1.5 leading-relaxed">
                  They won&apos;t be able to message or call you, and you won&apos;t see them in your contacts. You can unblock them anytime.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setConfirmBlock(false)}
                className="flex-1 py-2 rounded-full border border-tsismis-border text-sm font-semibold text-tsismis-muted hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="flex-1 py-2 rounded-full bg-red-500 text-sm font-semibold text-white hover:bg-red-600 active:scale-[0.97] transition-all cursor-pointer"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
