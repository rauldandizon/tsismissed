export type CallType = "audio" | "video";

export interface CallState {
  open: boolean;
  mode: "caller" | "receiver";
  callType: CallType;
  callUrl: string;
  roomName: string;
  conversationId: string;
  messageId: string;
}
