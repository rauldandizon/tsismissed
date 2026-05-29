"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ThemeLogo } from "@/components/ThemeLogo";
import { getUserDoc } from "@/lib/firestore";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    getUserDoc(user.uid).then((profile) => {
      if (!profile?.displayName) {
        router.push("/profile");
      } else {
        router.push("/chat");
      }
    });
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tsismis-bg">
      <ThemeLogo variant="icon" height={64} className="animate-pulse" />
      <p className="text-xs text-tsismis-hint mt-3">Loading...</p>
    </div>
  );
}
