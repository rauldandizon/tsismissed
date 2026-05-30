import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CallType } from "@/lib/callProvider";

export async function sendCallMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  callType: CallType,
  callUrl: string,
  roomName: string
): Promise<string> {
  const ref = await addDoc(
    collection(db, "conversations", conversationId, "messages"),
    {
      senderId,
      receiverId,
      type: "call",
      callType,
      callUrl,
      roomName,
      callStatus: "pending",
      createdAt: serverTimestamp(),
      readBy: [senderId],
    }
  );

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: callType === "audio" ? "Audio call" : "Video call",
    lastMessageType: "call",
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function updateCallMessage(
  conversationId: string,
  messageId: string,
  updates: { callStatus?: string; callDuration?: number }
): Promise<void> {
  await updateDoc(
    doc(db, "conversations", conversationId, "messages", messageId),
    updates
  );
}
