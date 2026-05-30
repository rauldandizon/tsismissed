"use client";

import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Phone, Video } from "lucide-react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getIframeAllowAttribute } from "@/lib/callProvider";
import { updateCallMessage } from "@/lib/calls";
import type { CallType } from "@/lib/callProvider";

const MISSED_CALL_TIMEOUT_MS = 60_000;

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "caller" | "receiver";
  callType: CallType;
  callUrl: string;
  conversationId: string;
  messageId: string;
}

export function CallDialog({
  open,
  onClose,
  mode,
  callType,
  callUrl,
  conversationId,
  messageId,
}: CallDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState("");
  const [joined, setJoined] = useState(false);

  // Tracks when this side's call actually started (receiver answered / receiver joined)
  // For caller: set when subscription detects "answered"
  // For receiver: set when they click Join
  const joinedAtRef = useRef<number | null>(null);
  const missedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always reflects the latest Firestore callStatus for this message
  const liveStatusRef = useRef<string | undefined>(undefined);

  // Subscribe to live call status so the caller knows when receiver answers
  useEffect(() => {
    if (!open || !conversationId || !messageId) return;

    const unsub = onSnapshot(
      doc(db, "conversations", conversationId, "messages", messageId),
      (snap) => {
        const status = snap.data()?.callStatus as string | undefined;
        liveStatusRef.current = status;

        if (mode === "caller" && status === "answered") {
          // Receiver joined — cancel the missed timer and start duration tracking
          if (missedTimerRef.current) {
            clearTimeout(missedTimerRef.current);
            missedTimerRef.current = null;
          }
          if (joinedAtRef.current === null) {
            joinedAtRef.current = Date.now();
          }
        }
      }
    );

    return unsub;
  }, [open, conversationId, messageId, mode]);

  // Caller: auto-load iframe and start 60s missed-call timer
  useEffect(() => {
    if (open && mode === "caller") {
      setIframeSrc(callUrl);
      setJoined(true);
      // joinedAtRef is NOT set here — only set when subscription sees "answered"

      missedTimerRef.current = setTimeout(() => {
        // Only write "missed" if receiver still hasn't answered
        if (!liveStatusRef.current || liveStatusRef.current === "pending") {
          updateCallMessage(conversationId, messageId, {
            callStatus: "missed",
          }).catch(() => {});
        }
      }, MISSED_CALL_TIMEOUT_MS);
    }

    // Cleanup ensures the timer is cancelled on unmount and on React's
    // dev-mode double-invoke (StrictMode), preventing orphaned timers that
    // would fire at 60s and write "missed" over an already-ended call.
    return () => {
      if (missedTimerRef.current) {
        clearTimeout(missedTimerRef.current);
        missedTimerRef.current = null;
      }
    };
  }, [open, mode, callUrl, conversationId, messageId]);

  // Auto-close when VDO.Ninja fires a disconnect postMessage
  useEffect(() => {
    if (!joined) return;

    function handleVdoMessage(e: MessageEvent) {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      const { action, value } = (e.data ?? {}) as { action?: string; value?: unknown };
      if (
        (action === "push-connection" || action === "view-connection") &&
        value === false
      ) {
        handleClose(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    }

    window.addEventListener("message", handleVdoMessage);
    return () => window.removeEventListener("message", handleVdoMessage);
  }, [joined]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (iframeRef.current) {
      iframeRef.current.src = "";
    }

    if (missedTimerRef.current) {
      clearTimeout(missedTimerRef.current);
      missedTimerRef.current = null;
    }

    const status = liveStatusRef.current;

    // Skip update if Firestore already has a terminal status
    if (status !== "ended" && status !== "missed") {
      if (joinedAtRef.current !== null) {
        // Call was answered — record duration
        const duration = Math.round((Date.now() - joinedAtRef.current) / 1000);
        updateCallMessage(conversationId, messageId, {
          callStatus: "ended",
          callDuration: duration,
        }).catch(() => {});
      } else {
        // Caller closing before receiver answered, or receiver closing without joining
        updateCallMessage(conversationId, messageId, {
          callStatus: "missed",
        }).catch(() => {});
      }
    }

    setIframeSrc("");
    setJoined(false);
    joinedAtRef.current = null;
    liveStatusRef.current = undefined;
    onClose();
  }

  function handleJoin() {
    setIframeSrc(callUrl);
    setJoined(true);
    joinedAtRef.current = Date.now();
    updateCallMessage(conversationId, messageId, {
      callStatus: "answered",
    }).catch(() => {});
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-tsismis-bg/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-tsismis-sidebar text-tsismis-text border-b border-tsismis-border shrink-0">
        <div className="flex items-center gap-2.5">
          {callType === "audio" ? (
            <Phone size={18} className="text-tsismis-pink" />
          ) : (
            <Video size={18} className="text-tsismis-pink" />
          )}
          <span className="text-sm font-semibold">
            {callType === "audio" ? "Voice Call" : "Video Call"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={callUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="p-1.5 rounded-full text-tsismis-muted hover:text-tsismis-text hover:bg-white/5 transition-all cursor-pointer"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={handleClose}
            title="End call"
            className="p-1.5 rounded-full text-[#FF4D6D] hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
        {!joined ? (
          mode === "receiver" ? (
            <div className="flex flex-col items-center gap-5 text-center p-8 bg-tsismis-surface/40 backdrop-blur border border-tsismis-border rounded-2xl max-w-sm mx-4 animate-in zoom-in-95 duration-250">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-tsismis-gradient shadow-lg shadow-tsismis-pink/15">
                {callType === "audio" ? (
                  <Phone size={28} className="text-white" />
                ) : (
                  <Video size={28} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-tsismis-text text-base font-bold">
                  {callType === "audio" ? "Tawag na Boses" : "Tawag na Video"}
                </p>
                <p className="text-tsismis-muted text-xs mt-1">
                  May tumatawag sa iyo sa TsisMissed...
                </p>
              </div>
              <button
                onClick={handleJoin}
                className="px-6 py-2.5 bg-tsismis-gradient hover:opacity-90 active:scale-[0.97] text-white rounded-full text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-tsismis-pink/15"
              >
                Sumali sa tawag
              </button>
            </div>
          ) : null
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            allow={getIframeAllowAttribute()}
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        )}
      </div>
    </div>
  );
}
