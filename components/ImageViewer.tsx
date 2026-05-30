"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2 } from "lucide-react";

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

export function ImageViewer({ url, onClose }: ImageViewerProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = blob.type.split("/")[1] ?? "jpg";
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `image.${ext}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // fallback: open in new tab
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [onClose]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // user dismissed share sheet — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col h-screen overflow-hidden"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="flex items-center gap-2">
          {copied && (
            <span className="text-xs text-white/60 mr-1">Link copied</span>
          )}
          <button
            onClick={handleShare}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Share"
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            disabled={downloading}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Download"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt="Full size"
          className="max-h-full max-w-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
