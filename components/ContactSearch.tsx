"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { searchUsers, addContact } from "@/lib/contacts";
import { SearchResultItem } from "@/components/SearchResultItem";
import type { UserProfile } from "@/types/user";

interface ContactSearchProps {
  term: string;
  currentUid: string;
  contactUids: Set<string>;
}

export function ContactSearch({ term, currentUid, contactUids }: ContactSearchProps) {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchUsers(term, currentUid).then((users) => {
      if (!cancelled) {
        setResults(users);
        setSearching(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [term, currentUid]);

  if (searching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={20} className="animate-spin text-tsismis-pink" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-4 py-12 text-center select-none">
        <p className="text-sm font-semibold text-tsismis-muted">Wala kaming nahanap.</p>
        <p className="text-xs text-tsismis-hint mt-1">Subukan mong mag-search ng ibang pangalan.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {results.map((user) => (
        <li key={user.uid}>
          <SearchResultItem
            user={user}
            isContact={contactUids.has(user.uid)}
            onAdd={() => addContact(currentUid, user)}
          />
        </li>
      ))}
    </ul>
  );
}
