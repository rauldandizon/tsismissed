"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";
import { sendPasswordResetEmail } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyError(err.message) : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      title="Reset Password"
      chatPreviewType="forgot-password"
      footer={
        <Link href="/login" className="text-tsismis-pink hover:underline font-semibold">Back to sign in</Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle size={40} className="text-tsismis-cyan animate-in fade-in duration-300" />
          <p className="text-sm text-tsismis-muted leading-relaxed">
            Password reset link sent to <strong className="text-tsismis-text">{email}</strong>. Check your inbox.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-tsismis-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>
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
          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-tsismis-gradient hover:opacity-90 text-white font-semibold rounded-full px-6 py-2.5 text-sm disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer shadow-lg shadow-tsismis-pink/15"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Send Reset Link
          </button>
        </form>
      )}
    </AuthForm>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("user-not-found")) return "No account found with this email.";
  if (msg.includes("invalid-email")) return "Invalid email address.";
  return "Failed to send reset email. Please try again.";
}
