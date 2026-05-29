# PROGRESS.md

## TsisMissed Chat MVP — Progress Tracker

Read this file before starting any session. Update this file after completing any session. Never start a new session without updating the previous session's status first.

---

## Project Status Summary

```
Current Session   : Session 6 — Polish, Rules, and Deployment
Overall Status    : In Progress
Last Updated      : 2026-05-30
Build Status      : Passed (Next.js 16.2.6, Turbopack)
Deployment Status : Not Deployed
```

---

## Session Checklist

```
[x] Session 1 — Foundation
[x] Session 2 — Authentication and User Profile
[x] Session 3 — Contacts and Search
[x] Session 4 — One-on-One Chat
[x] Session 5 — Calling Feature
[ ] Session 6 — Polish, Rules, and Deployment
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

## Session 6 — Polish, Rules, and Deployment

**Scope:** Finish UI polish, remove non-functional controls, finalize Firestore security rules, update README, test Vercel deployment readiness, and document known limitations.

**Status:** `In Progress`

**Files Created or Modified:**

```
components/ChatLayout.tsx           modified (×3 — theme header fix, empty state logo, sidebar profile footer)
components/ThemeToggle.tsx          modified
components/AuthForm.tsx             modified (two-column layout + contextual chat previews + 30% logo)
app/login/page.tsx                  modified
app/register/page.tsx               modified
app/forgot-password/page.tsx        modified
```

**Acceptance Criteria:**

```
[ ] No visible clickable UI control is non-functional
[ ] Kebab menus either work, are hidden, or show Coming Soon clearly
[ ] UI is clean on desktop and mobile
[ ] Firestore security rules protect profiles, contacts, conversations, and messages
[ ] README explains Firebase setup
[ ] README explains Cloudinary setup
[ ] README explains audio call requires both &videodevice=0 and &novideo
[ ] README explains why &novideo alone is insufficient
[ ] README explains why receiver must click before iframe loads
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

- User B has no notification that User A added them as a contact until User A
  sends a message. Intentional for MVP simplicity.

- VDO.Ninja iframe embedding requires SSL. Handled automatically on Vercel.
  Custom domains must also have SSL enabled.

- Browser autoplay policy requires the receiver to click before the call iframe
  loads. Silent auto-join for the receiver is not possible without additional setup.

- VDO.Ninja rooms do not expire automatically. Room names are unique per call
  session by design.

- firestore.indexes.json is empty because Firestore automatically maintains
  single-field indexes. The displayNameLower prefix search does not need an
  explicit composite index.
```

---

## Next Steps

```
- Continue Session 6: Polish, Rules, and Deployment
  - Remove or hide any non-functional UI controls
  - Finalize Firestore security rules
  - Update README with Firebase, Cloudinary, and calling setup
  - Test Vercel deployment readiness
  - Run full two-user test log
```
