"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ChatLayout } from "@/components/ChatLayout";

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.providerData[0]?.providerId === "password" && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  if (loading || !user || (user.providerData[0]?.providerId === "password" && !user.emailVerified)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return <ChatLayout />;
}
