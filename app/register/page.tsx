"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import { createOrUpdateUserDoc } from "@/lib/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const cred = await signUpWithEmail(email, password);
      await createOrUpdateUserDoc(cred.user);
      router.push("/verify-email");
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyError(err.message) : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      await createOrUpdateUserDoc(cred.user);
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyError(err.message) : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      title="Create Account"
      chatPreviewType="register"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-tsismis-pink hover:underline font-semibold">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-tsismis-muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tsismosa@example.com"
            className="w-full bg-tsismis-surface border border-tsismis-border rounded-xl px-4 py-2.5 text-sm text-tsismis-text placeholder:text-tsismis-hint focus:border-tsismis-pink focus:ring-1 focus:ring-tsismis-pink/30 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-tsismis-muted mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full bg-tsismis-surface border border-tsismis-border rounded-xl px-4 py-2.5 pr-10 text-sm text-tsismis-text placeholder:text-tsismis-hint focus:border-tsismis-pink focus:ring-1 focus:ring-tsismis-pink/30 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tsismis-muted hover:text-tsismis-text transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-tsismis-muted mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full bg-tsismis-surface border border-tsismis-border rounded-xl px-4 py-2.5 pr-10 text-sm text-tsismis-text placeholder:text-tsismis-hint focus:border-tsismis-pink focus:ring-1 focus:ring-tsismis-pink/30 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tsismis-muted hover:text-tsismis-text transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-tsismis-gradient hover:opacity-90 text-white font-semibold rounded-full px-6 py-2.5 text-sm disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-tsismis-pink/15"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Create Account
        </button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-tsismis-border" />
        </div>
        <div className="relative flex justify-center text-xs text-tsismis-hint">
          <span className="bg-tsismis-surface px-2">or</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-transparent border border-tsismis-border text-tsismis-text rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-white/5 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </AuthForm>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("email-already-in-use")) return "An account with this email already exists.";
  if (msg.includes("invalid-email")) return "Invalid email address.";
  if (msg.includes("weak-password")) return "Password is too weak.";
  if (msg.includes("popup-closed-by-user")) return "Sign-in popup was closed.";
  return "Registration failed. Please try again.";
}
