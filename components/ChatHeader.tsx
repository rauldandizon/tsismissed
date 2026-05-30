"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MoreVertical, ShieldAlert, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { CallButton } from "@/components/CallButton";
import type { Contact } from "@/types/contact";
import type { CallType } from "@/lib/callProvider";

interface ChatHeaderProps {
  contact: Contact;
  onBack: () => void;
  onStartCall: (callType: CallType) => void;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onViewProfile: () => void;
}

export function ChatHeader({
  contact,
  onBack,
  onStartCall,
  isBlocked,
  onBlock,
  onUnblock,
  onViewProfile,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleBlockClick() {
    setMenuOpen(false);
    setConfirmBlock(true);
  }

  function handleConfirmBlock() {
    setConfirmBlock(false);
    onBlock();
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-tsismis-border bg-tsismis-sidebar shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-full text-tsismis-muted hover:text-tsismis-text hover:bg-white/5 transition-all active:scale-[0.9]"
          aria-label="Back to contacts"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          onClick={onViewProfile}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          aria-label={`View ${contact.displayName}'s profile`}
        >
          <UserAvatar
            displayName={contact.displayName}
            photoURL={contact.photoURL}
            size={36}
          />
          <div className="flex flex-col min-w-0 text-left">
            <p className="text-sm font-semibold text-tsismis-text truncate">
              {contact.displayName}
            </p>
            {isBlocked && (
              <p className="text-xs text-red-400/80 leading-none mt-0.5">Blocked</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <CallButton callType="audio" onClick={onStartCall} disabled={isBlocked} />
          <CallButton callType="video" onClick={onStartCall} disabled={isBlocked} />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-full text-tsismis-muted hover:text-tsismis-text hover:bg-white/5 transition-all cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-tsismis-surface border border-tsismis-border rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={isBlocked ? (() => { setMenuOpen(false); onUnblock(); }) : handleBlockClick}
                  className={`w-full flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm transition-all active:scale-[0.97] hover:bg-white/5 cursor-pointer ${
                    isBlocked ? "text-[#2DC653]" : "text-red-400"
                  }`}
                >
                  {isBlocked
                    ? <><ShieldCheck size={14} /> Unblock</>
                    : <><ShieldAlert size={14} /> Block</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block confirmation dialog */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
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
    </>
  );
}
