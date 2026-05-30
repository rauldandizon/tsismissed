"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Send, Smile, Paperclip, ImageIcon, Music } from "lucide-react";
import { sendMessage, sendMediaMessage } from "@/lib/messages";
import { uploadMedia, getCloudinaryResourceType } from "@/lib/cloudinary";
import { setTyping, clearTyping } from "@/lib/typing";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/webm"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const AUDIO_MAX_BYTES = 15 * 1024 * 1024;

const QUICK_EMOJI = [
  "😂","😭","😍","🥰","😊","🤣","😅","😆","🥺","😢",
  "😩","🔥","❤️","💕","💖","👍","🙌","😎","🤔","😤",
  "😏","🥳","🤩","😱","🙈","💀","🫶","✨","💯","🤙",
];

interface MessageInputProps {
  conversationId: string;
  senderId: string;
  receiverId: string;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  senderId,
  receiverId,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const lastTypingSentAt = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      clearTyping(conversationId, senderId).catch(() => {});
    };
  }, [conversationId, senderId]);

  // Close emoji panel on outside click
  useEffect(() => {
    if (!showEmoji) return;
    function handleClick(e: MouseEvent) {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmoji]);

  // Close attach menu on outside click
  useEffect(() => {
    if (!showAttachMenu) return;
    function handleClick(e: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAttachMenu]);

  // Global drag detection — show overlay when a file is dragged over the page
  useEffect(() => {
    if (disabled) return;
    function onDragEnter(e: DragEvent) {
      if (uploadProgress !== null) return;
      if (e.dataTransfer?.types.includes("Files")) setIsDragOver(true);
    }
    document.addEventListener("dragenter", onDragEnter);
    return () => document.removeEventListener("dragenter", onDragEnter);
  }, [disabled, uploadProgress]);

  async function processFile(file: File) {
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Unsupported file type. Use JPG, PNG, WebP, MP3, M4A, or WebM.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const maxBytes = isImage ? IMAGE_MAX_BYTES : AUDIO_MAX_BYTES;
    if (file.size > maxBytes) {
      setUploadError(
        isImage ? "Image must be 5 MB or smaller." : "Audio clip must be 15 MB or smaller."
      );
      return;
    }

    const resourceType = getCloudinaryResourceType(file.type);
    const msgType = isImage ? "image" : "audio";

    setUploadProgress(0);
    try {
      const { url, publicId } = await uploadMedia(file, resourceType, setUploadProgress);
      await sendMediaMessage(conversationId, senderId, receiverId, msgType, url, publicId, file.type);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      console.error("[uploadMedia]", err);
      setUploadError(msg);
    } finally {
      setUploadProgress(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (disabled) return;
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingSentAt.current > 2000) {
      lastTypingSentAt.current = now;
      setTyping(conversationId, senderId).catch(() => {});
    }
    if (typingClearRef.current) clearTimeout(typingClearRef.current);
    typingClearRef.current = setTimeout(() => {
      clearTyping(conversationId, senderId).catch(() => {});
      lastTypingSentAt.current = 0;
    }, 3000);
  }

  function handleBlur() {
    if (typingClearRef.current) clearTimeout(typingClearRef.current);
    clearTyping(conversationId, senderId).catch(() => {});
    lastTypingSentAt.current = 0;
  }

  async function handleSend() {
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (typingClearRef.current) clearTimeout(typingClearRef.current);
    clearTyping(conversationId, senderId).catch(() => {});
    lastTypingSentAt.current = 0;
    setSending(true);
    setError(null);
    try {
      await sendMessage(conversationId, senderId, receiverId, trimmed);
      setText("");
      textareaRef.current?.focus();
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      el.selectionStart = start + emoji.length;
      el.selectionEnd = start + emoji.length;
      el.focus();
    });
    setShowEmoji(false);
  }

  if (disabled) {
    return (
      <div className="shrink-0 border-t border-tsismis-border bg-tsismis-sidebar px-4 py-3">
        <p className="text-xs text-tsismis-muted text-center select-none">
          You can&apos;t message this person.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Drag-and-drop overlay */}
      {isDragOver && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 border-4 border-dashed border-tsismis-pink animate-in fade-in duration-150"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
          }}
        >
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <Paperclip size={40} className="text-tsismis-pink" />
            <p className="text-white font-semibold text-lg">Drop to send</p>
            <p className="text-white/50 text-sm">Images up to 5 MB · Audio up to 15 MB</p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/webm"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="shrink-0 border-t border-tsismis-border bg-tsismis-sidebar p-4 transition-all duration-150">
        {(error || uploadError) && (
          <p className="text-xs text-red-400 mb-2 font-medium">{uploadError ?? error}</p>
        )}

        {uploadProgress !== null ? (
          <div className="flex flex-col gap-1.5 py-1">
            <div className="w-full h-1.5 rounded-full bg-tsismis-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-tsismis-gradient transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-tsismis-muted text-center font-medium">
              Uploading… {uploadProgress}%
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-2.5 relative">
            {/* Emoji panel */}
            {showEmoji && (
              <div
                ref={emojiPanelRef}
                className="absolute bottom-full mb-2 left-0 z-20 bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-xl p-2 grid grid-cols-10 gap-0.5 w-[280px] animate-in fade-in zoom-in-95 duration-150"
              >
                {QUICK_EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="text-lg p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer leading-none"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Attach menu */}
            {showAttachMenu && (
              <div
                ref={attachMenuRef}
                className="absolute bottom-full mb-2 left-0 z-20 bg-tsismis-surface border border-tsismis-border rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={() => { setShowAttachMenu(false); imageInputRef.current?.click(); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-tsismis-text hover:bg-white/10 transition-colors cursor-pointer text-left"
                >
                  <ImageIcon size={16} className="text-tsismis-pink shrink-0" />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAttachMenu(false); audioInputRef.current?.click(); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-tsismis-text hover:bg-white/10 transition-colors cursor-pointer text-left"
                >
                  <Music size={16} className="text-tsismis-cyan shrink-0" />
                  Audio
                </button>
              </div>
            )}

            {/* Attach button */}
            <button
              type="button"
              onClick={() => { setShowEmoji(false); setShowAttachMenu((v) => !v); }}
              title="Attach file"
              className={`p-2 rounded-full transition-all cursor-pointer shrink-0 ${
                showAttachMenu
                  ? "text-tsismis-pink bg-tsismis-pink/10"
                  : "text-tsismis-muted hover:text-tsismis-text hover:bg-white/5"
              }`}
            >
              <Paperclip size={18} />
            </button>

            {/* Emoji toggle */}
            <button
              type="button"
              onClick={() => { setShowAttachMenu(false); setShowEmoji((v) => !v); }}
              title="Emoji"
              className={`p-2 rounded-full transition-all cursor-pointer shrink-0 ${
                showEmoji
                  ? "text-tsismis-pink bg-tsismis-pink/10"
                  : "text-tsismis-muted hover:text-tsismis-text hover:bg-white/5"
              }`}
            >
              <Smile size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Mag-type ng tsismis..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-tsismis-border bg-tsismis-surface px-4 py-2.5 text-sm text-tsismis-text placeholder:text-tsismis-hint outline-none focus:border-tsismis-pink focus:ring-1 focus:ring-tsismis-pink/30 transition-all max-h-32 overflow-y-auto"
              style={{ lineHeight: "1.5" }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="p-2.5 rounded-full bg-tsismis-gradient text-white hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-tsismis-pink/10"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
