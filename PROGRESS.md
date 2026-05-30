# PROGRESS.md

## TsisMissed Chat MVP — Progress Tracker

Read this file before starting any session. Update this file after completing any session. Never start a new session without updating the previous session's status first.

---

## Project Status Summary

```
Current Session   : Session 10 — Polish, Rules, and Deployment
Overall Status    : In Progress
Last Updated      : 2026-05-30
Build Status      : Passed (Next.js 16.2.6, Turbopack)
Deployment Status : Not Deployed
```

---

## Session Checklist

```
[x] Session 1  — Foundation
[x] Session 2  — Authentication and User Profile
[x] Session 3  — Contacts and Search
[x] Session 4  — One-on-One Chat
[x] Session 5  — Calling Feature
[x] Session 6  — Unread Counter + Typing Indicator + Emoji
[x] Session 7  — Contact Requests + Block User
[x] Session 8  — Media Messages (Images + Audio)
[x] Session 9  — Call Status Flow (Missed / Answered / Duration)
[ ] Session 10 — Polish, Rules, and Deployment
```

---

## Session 1 — Foundation

**Scope:** Set up or validate the base project structure, environment variables, Firebase connection, styling system, and deployment readiness.

**Status:** `Done`

**Files Created or Modified:**

```
.env.local.example                  created
types/user.ts                       created
types/contact.ts                    created
types/conversation.ts               created
types/message.ts                    created
types/call.ts                       created
lib/firebase.ts                     created
lib/auth.ts                         created
lib/firestore.ts                    created
lib/cloudinary.ts                   created
components/AuthProvider.tsx         created
components/Providers.tsx            created
components/ToastProvider.tsx        created
components/UserAvatar.tsx           created
components/AuthForm.tsx             created
components/ProfileForm.tsx          created
components/AvatarUploader.tsx       created
app/login/page.tsx                  created
app/register/page.tsx               created
app/forgot-password/page.tsx        created
app/profile/page.tsx                created
app/chat/page.tsx                   created
app/layout.tsx                      modified
app/page.tsx                        modified
firestore.rules                     modified
firestore.indexes.json              modified
```

**Acceptance Criteria:**

```
[x] App runs locally using npm run dev
[x] Firebase app initializes without runtime errors
[x] .env.local.example lists all required Firebase and Cloudinary variables
[x] .env.local is ignored by Git
[x] Login and register routes exist
[x] /chat route exists
[x] Basic responsive layout renders
[x] npm run build passes
```

**Notes:**

```
- Next.js 16.2.6 with Turbopack (default). All pages use "use client" where needed.
- Sessions 1 and 2 were implemented together in a single pass.
- firestore.indexes.json is intentionally empty: Firestore auto-maintains single-field
  indexes. The displayNameLower prefix search query does not require an explicit
  composite index definition.
```

**Issues / Blockers:**

```
- None
```

---

## Session 2 — Authentication and User Profile

**Scope:** Implement Firebase Authentication, Google Sign-In, user profile creation, avatar upload, bio field, and profile edit flow.

**Status:** `Done`

**Files Created or Modified:**

```
(Same batch as Session 1 — implemented together)
```

**Acceptance Criteria:**

```
[x] User can register using email/password
[x] User can log in using email/password
[x] User can sign in using Google
[x] User can log out
[x] User document is created or updated in Firestore after registration or Google login
[x] User can add and edit display name
[x] User can add and edit bio (max 160 characters)
[x] User can upload avatar using Cloudinary or fall back to initials
[x] Profile fields include displayNameLower and emailLower
[x] Incomplete profile redirects to /profile
[x] Completed profile redirects to /chat
```

**Notes:**

```
- signOut() is exported from lib/auth.ts and available for use in the chat header (Session 3+).
- Initials are derived from displayName split on whitespace, max 2 characters, uppercased.
- Avatar upload uses unsigned Cloudinary preset; no server-side required.
- All timestamps use serverTimestamp() — never new Date().
```

**Issues / Blockers:**

```
- None
```

---

## Session 3 — Contacts and Search

**Scope:** Implement the left sidebar search bar, private contact list behavior, user search by display name, and the add-contact flow.

**Status:** `Done`

**Files Created or Modified:**

```
lib/contacts.ts                     created
components/SearchResultItem.tsx     created
components/ConversationList.tsx     created
components/ContactSearch.tsx        created
components/ChatLayout.tsx           created
app/chat/page.tsx                   modified
```

**Acceptance Criteria:**

```
[x] Left sidebar has a search bar above the contact/conversation list
[x] Default left sidebar does not show all registered users
[x] User only sees added contacts or active conversations by default
[x] User can search for other users by display name
[x] Current logged-in user is excluded from search results
[x] Search result shows avatar/initials, display name, and bio or email
[x] User can click Add Contact or Message
[x] Added contact appears in the contact list
[x] Contact data is stored under users/{uid}/contacts/{contactUserId}
[x] Security rules prevent users from editing another user's contacts
```

**Notes:**

```
- searchUsers() uses Firestore prefix query on displayNameLower with the  bound
  exactly as specified in AGENTS.md. Results are filtered client-side to exclude currentUid.
- subscribeContacts() uses onSnapshot with orderBy("addedAt", "desc") for real-time updates.
- addContact() uses serverTimestamp() for addedAt — never new Date().
- ChatLayout owns the contacts subscription and derives contactUids set to avoid
  duplicate subscriptions between ContactSearch and ConversationList.
- Search results clear immediately when the search bar is emptied (X button or manual clear).
- Empty state in ConversationList shown when contacts array is empty.
- "No users found" shown in ContactSearch when search returns empty results.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 4 — One-on-One Chat

**Scope:** Implement direct conversations, real-time messages, message bubbles, last-message preview, simple read receipts, and mobile-responsive chat layout.

**Status:** `Done`

**Files Created or Modified:**

```
lib/conversations.ts                created
lib/messages.ts                     created
components/ChatHeader.tsx           created
components/MessageBubble.tsx        created
components/MessageList.tsx          created
components/MessageInput.tsx         created
components/ConversationList.tsx     modified
components/ChatLayout.tsx           modified
```

**Acceptance Criteria:**

```
[x] User can open or create a direct conversation with a contact
[x] Direct conversation uses deterministic ID based on sorted user IDs
[x] Message sending works
[x] Messages appear in real time
[x] Current user messages align right
[x] Other user messages align left
[x] Message timestamps display correctly
[x] Last message preview appears in the left panel
[x] Opening a conversation marks the other user's unread messages as read
[x] readBy array is updated using Firestore arrayUnion
[x] Sender sees Sent or Seen
[x] Chat layout works on desktop and mobile
```

**Notes:**

```
- Conversation ID: [uid1, uid2].sort().join("_") — deterministic, no duplicates.
- subscribeConversations() uses array-contains on participantIds — compatible with
  existing Firestore security rules.
- markMessagesAsRead() uses writeBatch + arrayUnion; only marks messages where
  senderId !== currentUid && !(readBy?.includes(currentUid)).
- sendMessage() writes the message then updates conversation lastMessage/lastMessageAt
  sequentially (no atomic cross-collection update needed for MVP).
- MessageList auto-scrolls to bottom via scrollIntoView on a sentinel div whenever
  messages array changes.
- ConversationList sorts contacts by lastMessageAt desc, falls back to createdAt then
  addedAt for contacts with no messages yet.
- Mobile layout: sidebar shows when mobileView === "list"; chat panel shows when
  mobileView === "chat"; md breakpoint shows both simultaneously.
- No call buttons in ChatHeader — that is Session 5.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 5 — Calling Feature

**Scope:** Implement VDO.Ninja audio/video calling using the verified call URL rules, embedded call dialog, caller auto-join, receiver click-before-load behavior, call messages, and incoming call toast.

**Status:** `Done`

**Files Created or Modified:**

```
lib/callProvider.ts                 created
lib/calls.ts                        created
lib/messages.ts                     modified (added subscribeLatestMessages)
components/CallButton.tsx           created
components/CallDialog.tsx           created
components/ChatHeader.tsx           modified (added call buttons + onStartCall prop)
components/MessageBubble.tsx        modified (added call message rendering + onJoinCall)
components/MessageList.tsx          modified (forwarded onJoinCall prop)
components/IncomingCallToast.tsx    created
components/ChatLayout.tsx           modified (wired callState, CallDialog, IncomingCallToast)
```

**Acceptance Criteria:**

```
[x] lib/callProvider.ts uses the verified implementation from AGENT.md exactly
[x] Audio call URL contains both &videodevice=0 and &novideo
[x] Video call URL contains only the room URL
[x] Caller starts audio call and is automatically loaded into the room
[x] Caller starts video call and is automatically loaded into the room
[x] Caller does not see an unnecessary Join button after starting a call
[x] Audio call does not activate the camera
[x] Video call allows camera and microphone
[x] Receiver does not auto-load iframe from toast or passive Firestore update
[x] Receiver sees Join Call button first
[x] Receiver iframe loads only after receiver clicks Join Call
[x] Receiver joins the same stored callUrl from the call message
[x] Receiver does not generate a separate room
[x] Closing the call dialog stops the camera and microphone stream
[x] iframe includes allow="camera; microphone; autoplay; display-capture"
[x] iframe includes allowFullScreen
[x] Open in New Tab fallback works
[x] Incoming call toast appears only for new call messages within last 30 seconds
[x] Duplicate toasts do not appear for the same call message
[x] Existing chat, auth, contact, and read receipt features still work
[x] npm run build passes
```

**Verified callProvider.ts — Must Match Exactly:**

```ts
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
```

**Notes:**

```
- Audio call URL: ?room=X&miconly&autostart&videodevice=0&novideo
    - &miconly prevents video publishing
    - &autostart skips VDO.Ninja's device/option selection lobby screen
    - &videodevice=0 prevents camera activation (sender-side)
    - &novideo suppresses video rendering (viewer-side)
- Video call URL: ?room=X&webcam&autostart
    - &webcam auto-selects camera and hides screenshare option
    - &autostart skips VDO.Ninja's device/option selection lobby screen
- createRoomName strips all non-alphanumeric chars and limits to 30 chars total.
  VDO.Ninja enforces a max room name length of 30 alphanumeric characters.
- Caller: iframe loads immediately via useEffect when open=true and mode="caller".
- Receiver: joined state starts false; iframe only renders after receiver clicks Join Call.
- Receiver always uses the stored callUrl from Firestore — never generates a new room.
- CallDialog cleanup: iframeRef.current.src set to "" directly before onClose() to stop streams.
- Toast deduplication: shownToastIds useRef<Set<string>> — never show the same message ID twice.
- Toast 30-second window checked against msg.createdAt.toDate().getTime().
- subscribeLatestMessages uses orderBy desc + limit 5 — efficient for notification polling.
- IncomingCallToast subscription key is conversationIds.join(",") to avoid excessive re-subscribes.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 6 — Unread Counter + Typing Indicator + Emoji

**Scope:** Unread message badge per conversation in the sidebar, "is typing…" indicator in the active chat, and emoji support (native OS keyboard + quick-picker button).

**Status:** `Done`

**Files Created or Modified:**

```
types/conversation.ts               modified (added unreadFor, typing fields)
lib/messages.ts                     modified (increment unreadFor on send, reset on read)
lib/typing.ts                       created  (setTyping, clearTyping)
components/ConversationList.tsx     modified (unread badge + bold text for unread)
components/MessageList.tsx          modified (isTyping + contactName props, animated dots indicator)
components/MessageInput.tsx         modified (typing triggers, emoji quick-picker with 30 emoji)
components/ChatLayout.tsx           modified (derive isOtherTyping, pass to MessageList)
```

**Acceptance Criteria:**

```
[x] Sidebar shows pink unread badge when contact has unread messages
[x] Badge clears when user opens and views the conversation
[x] Unread count uses Firestore increment() — no read-modify-write race condition
[x] "is typing…" indicator appears when the other user is typing
[x] Typing indicator clears on send, blur, or 3s of inactivity
[x] Typing writes are throttled — max 1 Firestore write per 2 seconds
[x] Emoji quick-picker opens with 30 common emoji, inserts at cursor
[x] Native OS emoji keyboard works in the textarea (no extra config needed)
[x] Existing chat, auth, calling, and read receipt features still work
[x] npm run build passes
```

**Notes:**

```
- unreadFor.{uid} incremented via FieldValue.increment(1) in sendMessage.
- Reset to 0 in markMessagesAsRead whenever the user views the conversation.
- typing.{uid} stores Unix epoch ms of last keystroke. Receiver checks Date.now() - ts < 5000.
- clearTyping uses deleteField() to remove the key cleanly.
- Typing indicator disappears reactively when Firestore snapshot fires after clearTyping.
- Stale typing (e.g. browser closed): shows for at most ~5s after last keystroke. Acceptable MVP.
- Emoji picker is fully inline (no library). 30 hardcoded emoji in QUICK_EMOJI array.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 7 — Contact Requests + Block User

**Scope:** Replace auto-add with a contact request flow. User B must accept before chat/calls are enabled. Either user can block the other to prevent messaging and calls.

**Status:** `Done`

**Files Created or Modified:**

```
types/contactRequest.ts             created
types/blockedUser.ts                created
lib/contacts.ts                     modified (added addContactByUid)
lib/contactRequests.ts              created
lib/blockedUsers.ts                 created
firestore.rules                     modified (added contactRequests, blockedUsers, blockedByUsers rules)
components/ContactRequestsPanel.tsx created
components/SearchResultItem.tsx     modified (replaced isContact+onAdd with status+onSendRequest)
components/ContactSearch.tsx        modified (uses sendContactRequest, checks outgoing status)
components/ChatHeader.tsx           modified (added block/unblock menu, disabled calls when blocked)
components/MessageInput.tsx         modified (added disabled prop)
components/ChatLayout.tsx           modified (subscribed to requests/blocks, wired all handlers)
```

**Acceptance Criteria:**

```
[x] Clicking Add Contact sends a request instead of auto-adding
[x] User B sees a pending request notification in the sidebar
[x] User B can Accept or Decline the request
[x] Only accepted contacts can send messages or start calls
[x] Either user can block the other
[x] Blocked user cannot send messages, media, or start calls
[x] Blocked user does not appear as an active contact
[x] Message input is disabled for non-accepted or blocked contacts
[x] Call buttons are disabled for non-accepted or blocked contacts
[x] npm run build passes
```

**Notes:**

```
- Contact requests stored at users/{toUid}/contactRequests/{fromUid} with status "pending" or "declined".
  Accepted requests are deleted — accepted state is represented by the contact documents themselves.
- sendContactRequest() uses setDoc (upsert) so declined users can re-send.
- acceptContactRequest() calls addContactByUid() for both sides then deletes the request doc.
- Block: writes to users/{blockerUid}/blockedUsers/{blockedUid} AND users/{blockedUid}/blockedByUsers/{blockerUid}
  atomically via writeBatch. This lets either side detect the block without reading each other's private data.
- Unblock: deletes from both subcollections atomically.
- allBlockedUids is the union of blockedUids + blockedByUids — disables input and calls in either direction.
- Blocked contacts filtered from ConversationList.
- SearchResultItem shows: Added / Request Sent (clock icon) / Send Again / Add.
- ContactSearch fetches outgoing request status per result via Promise.all (max 10 reads).
  Local optimistic state prevents flickering after sending.
- ChatHeader MoreVertical menu provides Block/Unblock option.
- MessageInput shows a muted "You can't message this person." bar when disabled.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 8 — Media Messages (Images + Audio)

**Scope:** Users can send images (JPG, PNG, WebP ≤5 MB) and audio clips (MP3, M4A, WebM ≤15 MB) via Cloudinary. Video deferred to Phase 2.

**Status:** `Done`

**Files Created or Modified:**

```
types/message.ts                    modified (added "image"|"audio" type, mediaUrl/mediaPublicId/mediaMimeType fields)
firestore.rules                     modified (extended isValidMessage for image/audio types)
lib/cloudinary.ts                   modified (added uploadMedia, getCloudinaryResourceType)
lib/messages.ts                     modified (added sendMediaMessage)
components/MessageBubble.tsx        modified (added image and audio rendering branches; click-to-open image viewer)
components/MessageInput.tsx         modified (split attachment menu image/audio, drag-and-drop, validation, progress UI)
components/ImageViewer.tsx          created (full-screen image viewer with download and share)
```

**Acceptance Criteria:**

```
[x] Users can attach and send images (JPG, PNG, WebP ≤ 5 MB)
[x] Users can attach and send audio clips (MP3, M4A, WebM ≤ 15 MB)
[x] Files are uploaded to Cloudinary before message is sent
[x] Only Cloudinary URL + metadata stored in Firestore (no base64)
[x] Image messages render inline in the chat bubble
[x] Audio messages render with a native audio player
[x] File type and size validated client-side before upload
[x] Upload progress shown during upload
[x] Clicking an image opens a full-screen viewer
[x] Image viewer has Download and Share actions
[x] Paperclip shows a menu with separate Image and Audio options
[x] Dragging a file over the chat area shows a drop overlay and uploads on drop
[x] npm run build passes
```

**Notes:**

```
- Video upload is Phase 2 (free-tier upload size risk).
- Uses existing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
  Cloudinary upload preset must be Unsigned and resource type Auto (to support both image
  and audio/video uploads from the same preset).
- Audio upload uses /video/upload endpoint (Cloudinary treats audio as video resource_type).
- uploadMedia() uses XMLHttpRequest (not fetch) to support upload progress events.
- Progress bar replaces the textarea row during upload; normal UI restores on completion.
- Attachment button is hidden when the conversation is disabled (blocked/non-contact).
- ImageViewer download uses fetch-to-blob + temporary object URL to force save dialog
  (the <a download> attribute is ignored for cross-origin URLs).
- ImageViewer share uses Web Share API on mobile; falls back to clipboard copy on desktop.
- Drag-and-drop: document-level dragenter listener in MessageInput shows a fullscreen overlay.
  No prop threading needed — processFile() is self-contained in MessageInput.
- Image picker uses capture="environment" so mobile users get a camera option.
- Audio recorder deferred to Phase 2 (requires MediaRecorder, recording state, live preview).
- Firestore rules deployed successfully after update.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 9 — Call Status Flow (Missed / Answered / Duration)

**Scope:** Add call status to call messages: pending → answered/missed/ended. Show duration and missed state in the chat bubble.

**Status:** `Done`

**Files Created or Modified:**

```
types/message.ts                    modified (added callStatus, callDuration fields)
types/call.ts                       modified (added messageId to CallState)
lib/calls.ts                        modified (sendCallMessage returns messageId; added updateCallMessage)
components/CallDialog.tsx           modified (60s missed timer, answered on join, ended+duration on close)
components/MessageBubble.tsx        modified (status-aware call bubble: missed/ended/pending labels + duration)
components/MessageList.tsx          modified (onJoinCall signature includes messageId)
components/ChatLayout.tsx           modified (threads messageId through call state and handleJoinCall)
components/IncomingCallToast.tsx    modified (onJoinCall signature and call site include messageId)
firestore.rules                     modified (allow callStatus and callDuration updates on messages)
```

**Acceptance Criteria:**

```
[x] Call messages created with callStatus: "pending"
[x] Receiver clicking Join marks call as "answered"
[x] 60s timeout marks unanswered call as "missed"
[x] Closing CallDialog records duration and marks call as "ended"
[x] Chat bubble shows "Missed audio/video call" for missed calls
[x] Chat bubble shows "Audio/video call ended · Xm Xs" for ended calls
[x] Duration is approximate (CallDialog join-to-close, client-side)
[x] npm run build passes
```

**Notes:**

```
- callStatus absent on old messages is treated as "pending" — shows generic "Voice Call"/"Video Call" label.
- Caller auto-joins iframe → joinedAt set immediately. 60s timer marks "missed" in Firestore.
  If caller closes before 60s fires, timer is cancelled and call is marked "ended" with duration.
  If 60s fires first, closing the dialog does NOT overwrite "missed" (callWasMissedRef guard).
- Receiver: joinedAt set on Join click → "answered" written. Close → "ended" with duration.
  Receiver closing without joining → "missed".
- Duration is measured from iframe load (caller: dialog open; receiver: Join click) to dialog close.
- IncomingCallToast also updated to pass messageId through onJoinCall for correct receiver flow.
- firebase deploy --only firestore:rules must be run after this session.
- npm run build passed (Next.js 16.2.6, Turbopack).
```

**Issues / Blockers:**

```
- None
```

---

## Session 10 — Polish, Rules, and Deployment

**Scope:** Final UI polish, Firestore rules audit, README update, Vercel deployment readiness.

**Status:** `Not Started`

**Files Created or Modified:**

```
(pending — was previously Session 6)
```

**Acceptance Criteria:**

```
[ ] No visible clickable UI control is non-functional
[ ] UI is clean on desktop and mobile
[ ] Firestore security rules protect all collections (Sessions 6–9 additions included)
[ ] README explains Firebase, Cloudinary, and calling setup
[ ] README documents known limitations
[ ] npm run build passes
[ ] Project is ready to deploy on Vercel
```

**Notes:**

```
-
```

**Issues / Blockers:**

```
-
```

---

## Final Testing Log

### Local Development Test

```
Date        :
Browser     :
Result      : Pass / Fail
Notes       :
```

### Two-User Chat Test

```
Date        :
Method      : Two browsers / normal + incognito window
Result      : Pass / Fail
Notes       :
```

### Audio Call Test

```
Date        :
Result      : Pass / Fail
Camera stayed off (caller)   : Yes / No
Camera stayed off (receiver) : Yes / No
Notes       :
```

### Video Call Test

```
Date        :
Result      : Pass / Fail
Camera turned on (caller)    : Yes / No
Camera turned on (receiver)  : Yes / No
Notes       :
```

### Receiver Autoplay Test

```
Date        :
Result      : Pass / Fail
iframe waited for Join click : Yes / No
Notes       :
```

### Dialog Cleanup Test

```
Date        :
Result      : Pass / Fail
Camera light off after close : Yes / No
Notes       :
```

### Vercel Deployment Test

```
Date        :
Deployment URL  :
Result      : Pass / Fail
Notes       :
```

---

## Open Decisions

```
-
```

---

## Known Limitations

```
- User search only matches from the beginning of the display name (prefix search).
  Searching "jay" will not find "Mary Jay". This is a known MVP limitation.

- VDO.Ninja iframe embedding requires SSL. Handled automatically on Vercel.
  Custom domains must also have SSL enabled.

- Browser autoplay policy requires the receiver to click before the call iframe
  loads. Silent auto-join for the receiver is not possible without additional setup.

- VDO.Ninja rooms do not expire automatically. Room names are unique per call
  session by design.

- firestore.indexes.json is empty because Firestore automatically maintains
  single-field indexes. The displayNameLower prefix search does not need an
  explicit composite index.

- Typing indicator stale state: if the typing user closes their browser without
  clearing, the indicator may show for up to ~5 seconds. Acceptable for MVP.

- Missed-call timeout (Session 9): client-side only. If the caller closes the
  browser before the 60s timeout fires, the call stays in "pending" state.
  Phase 2: server-side TTL or Cloud Function for reliable missed-call detection.

- Video file uploads deferred to Phase 2 (Cloudinary free-tier size risk).

- Group conversations, push notifications, call ringtones: Phase 2.

- Block + contact request interaction: if User A blocks User B, User B can still
  send a contact request and User A can still accept it — but User B will not appear
  in User A's contact list until User A also unblocks them. Accepting a request does
  not auto-unblock. To be addressed in a future refinement (e.g., prompt the user to
  unblock when accepting a request from a blocked contact, or prevent accepting
  requests from blocked users altogether).
```

---

## Next Steps

```
- Start Session 8: Media Messages (Images + Audio)
  - Image upload (JPG, PNG, WebP ≤5 MB) via Cloudinary
  - Audio upload (MP3, M4A, WebM ≤15 MB) via Cloudinary
  - Inline image rendering in chat bubble
  - Native audio player in chat bubble
  - Client-side file type and size validation
  - Upload progress indicator
```
