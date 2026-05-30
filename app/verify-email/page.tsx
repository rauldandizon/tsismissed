"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ThemeLogo } from "@/components/ThemeLogo";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.emailVerified) {
      router.push("/profile");
    }
  }, [user, loading, router]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  async function handleResend() {
    if (!auth.currentUser) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendSuccess(true);
      setResendCooldown(60);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current!);
            cooldownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("[resend verification error]", err);
    } finally {
      setResendLoading(false);
    }
  }

  async function handleCheckVerified() {
    if (!auth.currentUser) return;
    setCheckLoading(true);
    setCheckMessage("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        router.push("/profile");
      } else {
        setCheckMessage("Email not verified yet. Please check your inbox.");
      }
    } catch (err) {
      console.error("[reload error]", err);
      setCheckMessage("Something went wrong. Please try again.");
    } finally {
      setCheckLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tsismis-bg">
        <Loader2 size={32} className="animate-spin text-tsismis-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tsismis-bg px-4">
      <div className="w-full max-w-md bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <ThemeLogo variant="icon" height={40} />
        </div>
        <h1 className="text-2xl font-bold text-tsismis-text mb-2 text-center">
          Verify Your Email
        </h1>
        <p className="text-sm text-tsismis-muted text-center mb-1">
          We sent a verification link to
        </p>
        <p className="text-sm font-semibold text-tsismis-text text-center mb-6 break-all">
          {user.email}
        </p>
        <p className="text-sm text-tsismis-muted text-center mb-8">
          Check your inbox (and spam folder), then click the link to verify your account.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleCheckVerified}
            disabled={checkLoading}
            className="flex items-center justify-center gap-2 bg-tsismis-gradient hover:opacity-90 text-white font-semibold rounded-full px-6 py-2.5 text-sm disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-tsismis-pink/15"
          >
            {checkLoading && <Loader2 size={14} className="animate-spin" />}
            I&apos;ve verified my email
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="flex items-center justify-center gap-2 bg-transparent border border-tsismis-border text-tsismis-text font-semibold rounded-full px-6 py-2.5 text-sm hover:bg-white/5 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
          >
            {resendLoading && <Loader2 size={14} className="animate-spin" />}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}
          </button>
        </div>

        {resendSuccess && resendCooldown > 0 && (
          <p className="text-sm text-green-500 text-center mt-4">
            Verification email sent!
          </p>
        )}
        {checkMessage && (
          <p className="text-sm text-red-400 text-center mt-4">{checkMessage}</p>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-tsismis-pink hover:underline cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
