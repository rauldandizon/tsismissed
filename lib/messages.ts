import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  arrayUnion,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Message } from "@/types/message";

export function subscribeMessages(
  conversationId: string,
  cb: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Message, "id">),
    }));
    cb(messages);
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();

  await addDoc(
    collection(db, "conversations", conversationId, "messages"),
    {
      senderId,
      receiverId,
      type: "text",
      text: trimmed,
      createdAt: serverTimestamp(),
      readBy: [senderId],
    }
  );

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: trimmed,
    lastMessageType: "text",
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadFor.${receiverId}`]: increment(1),
  });
}

export function subscribeLatestMessages(
  conversationId: string,
  cb: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Message, "id">),
    }));
    cb(messages);
  });
}

export async function sendMediaMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  type: "image" | "audio",
  mediaUrl: string,
  mediaPublicId: string,
  mediaMimeType: string
): Promise<void> {
  await addDoc(
    collection(db, "conversations", conversationId, "messages"),
    {
      senderId,
      receiverId,
      type,
      mediaUrl,
      mediaPublicId,
      mediaMimeType,
      createdAt: serverTimestamp(),
      readBy: [senderId],
    }
  );

  const lastMessage = type === "image" ? "📷 Photo" : "🎵 Audio clip";

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage,
    lastMessageType: "text",
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadFor.${receiverId}`]: increment(1),
  });
}

export async function markMessagesAsRead(
  conversationId: string,
  messages: Message[],
  currentUid: string
): Promise<void> {
  const unread = messages.filter(
    (m) => m.senderId !== currentUid && !m.readBy?.includes(currentUid)
  );

  const convRef = doc(db, "conversations", conversationId);

  if (unread.length > 0) {
    const batch = writeBatch(db);
    for (const msg of unread) {
      const ref = doc(db, "conversations", conversationId, "messages", msg.id);
      batch.update(ref, { readBy: arrayUnion(currentUid) });
    }
    await batch.commit();
  }

  // Always reset unread counter when this conversation is viewed
  await updateDoc(convRef, {
    [`unreadFor.${currentUid}`]: 0,
  });
}
