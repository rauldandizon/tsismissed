"use client";

import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import type { UserProfile } from "@/types/user";

interface SearchResultItemProps {
  user: UserProfile;
  isContact: boolean;
  onAdd: () => Promise<void>;
}

export function SearchResultItem({ user, isContact, onAdd }: SearchResultItemProps) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await onAdd();
    } finally {
      setAdding(false);
    }
  }

  const subtitle = user.bio?.trim() || user.email;

  return (
    <div className="flex items-center gap-3 p-3 transition-all duration-150 rounded-xl mx-2 my-0.5 border border-transparent hover:bg-white/5 hover:border-tsismis-border">
      <UserAvatar displayName={user.displayName} photoURL={user.photoURL} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-tsismis-text truncate">{user.displayName}</p>
        <p className="text-xs text-tsismis-muted truncate mt-0.5">{subtitle}</p>
      </div>
      {isContact ? (
        <span className="flex items-center gap-1 text-xs text-[#2DC653] font-semibold shrink-0 select-none">
          <Check size={14} />
          Added
        </span>
      ) : (
        <button
          onClick={handleAdd}
          disabled={adding}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-transparent border border-tsismis-pink text-tsismis-pink rounded-full px-4 py-1.5 hover:bg-tsismis-pink/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] cursor-pointer"
        >
          <UserPlus size={13} />
          {adding ? "Adding…" : "Add"}
        </button>
      )}
    </div>
  );
}
