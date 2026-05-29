"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getUserDoc, updateUserProfile } from "@/lib/firestore";
import { ProfileForm } from "@/components/ProfileForm";
import { AvatarUploader } from "@/components/AvatarUploader";
import { ThemeLogo } from "@/components/ThemeLogo";
import type { UserProfile } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [photoURL, setPhotoURL] = useState("");
  const [avatarPublicId, setAvatarPublicId] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    getUserDoc(user.uid).then((doc) => {
      setProfile(doc);
      setPhotoURL(doc?.photoURL ?? "");
      setAvatarPublicId(doc?.avatarPublicId ?? "");
      setProfileLoading(false);
    });
  }, [user, authLoading, router]);

  async function handleSave({ displayName, bio }: { displayName: string; bio: string }) {
    if (!user) return;
    await updateUserProfile(user.uid, {
      displayName,
      bio,
      photoURL,
      avatarPublicId,
    });
    router.push("/chat");
  }

  function handleAvatarUpload(url: string, publicId: string) {
    setPhotoURL(url);
    setAvatarPublicId(publicId);
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tsismis-bg">
        <Loader2 size={32} className="animate-spin text-tsismis-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tsismis-bg px-4 transition-all duration-150">
      <div className="w-full max-w-md bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-3">
          <ThemeLogo variant="icon" height={40} width={40} />
        </div>
        <h1 className="text-2xl font-bold text-tsismis-text mb-6 text-center">
          {profile?.displayName ? "Edit Profile" : "Set Up Your Profile"}
        </h1>
        <div className="mb-6">
          <AvatarUploader
            currentPhotoURL={photoURL}
            displayName={profile?.displayName ?? user?.email ?? ""}
            onUpload={handleAvatarUpload}
          />
        </div>
        <ProfileForm
          initialValues={{
            displayName: profile?.displayName ?? "",
            bio: profile?.bio ?? "",
          }}
          onSave={handleSave}
        />
        {profile?.displayName && (
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="mt-4 w-full text-sm text-tsismis-muted hover:text-tsismis-text text-center transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
