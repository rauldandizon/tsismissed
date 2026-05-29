export type CallType = "audio" | "video";

export function createRoomName(
  conversationId: string,
  callType: CallType
): string {
  // VDO.Ninja: alphanumeric only, max 30 chars
  const shortId = conversationId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const timestamp = Date.now().toString(36);
  return `tm${shortId}${callType === "audio" ? "a" : "v"}${timestamp}`;
}

export function buildCallUrl(
  roomName: string,
  callType: CallType
): string {
  const base = `https://vdo.ninja/?room=${encodeURIComponent(roomName)}`;

  if (callType === "audio") {
    return `${base}&miconly&autostart&videodevice=0&novideo`;
  }

  return `${base}&webcam&autostart`;
}

export function getIframeAllowAttribute(): string {
  return "camera; microphone; autoplay; display-capture; fullscreen";
}
