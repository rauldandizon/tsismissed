"use client";

import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Phone, Video } from "lucide-react";
import { getIframeAllowAttribute } from "@/lib/callProvider";
import type { CallType } from "@/lib/callProvider";

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "caller" | "receiver";
  callType: CallType;
  callUrl: string;
}

export function CallDialog({
  open,
  onClose,
  mode,
  callType,
  callUrl,
}: CallDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState("");
  const [joined, setJoined] = useState(false);

  // Caller auto-loads iframe; reset state when dialog closes
  useEffect(() => {
    if (open && mode === "caller") {
      setIframeSrc(callUrl);
      setJoined(true);
    }
    if (!open) {
      setIframeSrc("");
      setJoined(false);
    }
  }, [open, mode, callUrl]);

  function handleClose() {
    // Stop camera/mic streams before unmounting
    if (iframeRef.current) {
      iframeRef.current.src = "";
    }
    setIframeSrc("");
    setJoined(false);
    onClose();
  }

  function handleJoin() {
    setIframeSrc(callUrl);
    setJoined(true);
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
