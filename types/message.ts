import type { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: "text" | "call" | "image" | "audio";
  text?: string;
  callType?: "audio" | "video";
  callUrl?: string;
  roomName?: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  mediaMimeType?: string;
  callStatus?: "pending" | "answered" | "missed" | "ended";
  callDuration?: number;
  createdAt: Timestamp;
  readBy?: string[];
}
