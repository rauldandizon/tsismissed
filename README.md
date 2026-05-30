# TsisMissed

TsisMissed is a simple real-time chat web app where you can message, call, and share media with your contacts. It is built with Next.js, Firebase, and VDO.Ninja, and is designed to deploy on Vercel with zero backend servers to manage.

---

## Tech Stack

- **Next.js 15+** (App Router)
- **React** + **TypeScript**
- **Tailwind CSS**
- **Firebase Authentication** (email/password + Google)
- **Firestore** (real-time messages, contacts, conversations)
- **Cloudinary** (avatar and media uploads)
- **VDO.Ninja** (peer-to-peer audio/video calls via WebRTC)
- **Vercel** (deployment target)

---

## Prerequisites

- Node.js 18 or later
- A [Firebase project](https://console.firebase.google.com/) with Authentication and Firestore enabled
- A [Cloudinary account](https://cloudinary.com/) with an unsigned upload preset configured

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values before running the app.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

### Where to find each value

| Variable | Location |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps → SDK setup and configuration |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same as above |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same as above |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same as above |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard — shown in the top-left of the dashboard header |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload presets — create a preset set to **Unsigned** and resource type **Auto** |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase and Cloudinary values

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Firestore Setup

Deploy the security rules and indexes using the Firebase CLI:

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

If you do not have the Firebase CLI installed:

```bash
npm install -g firebase-tools
firebase login
```

---

## Vercel Deployment

1. Push your code to a GitHub repository (`.env.local` is already in `.gitignore`).
2. Import the repository in the [Vercel dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add all 8 variables from `.env.local.example` with your real values.
4. Click **Deploy**.

Alternatively, deploy from the CLI:

```bash
npx vercel
```

VDO.Ninja calls require HTTPS. Vercel provides SSL automatically on all deployments. Custom domains must also have SSL enabled.

---

## Known Limitations

- User search only matches from the beginning of the display name (prefix search). Searching "jay" will not find "Mary Jay". This is a known MVP limitation.

- VDO.Ninja iframe embedding requires SSL. Handled automatically on Vercel. Custom domains must also have SSL enabled.

- Browser autoplay policy requires the receiver to click before the call iframe loads. Silent auto-join for the receiver is not possible without additional setup.

- VDO.Ninja rooms do not expire automatically. Room names are unique per call session by design.

- `firestore.indexes.json` is empty because Firestore automatically maintains single-field indexes. The `displayNameLower` prefix search does not need an explicit composite index.

- Typing indicator stale state: if the typing user closes their browser without clearing, the indicator may show for up to ~5 seconds. Acceptable for MVP.

- Missed-call timeout is client-side only. If the caller closes the browser before the 60-second timeout fires, the call stays in "pending" state. A server-side Cloud Function would be needed for reliable missed-call detection.

- Video file uploads are deferred to Phase 2 (Cloudinary free-tier size risk).

- Group conversations, push notifications, and call ringtones are Phase 2.

- Block + contact request interaction: if User A blocks User B, User B can still send a contact request and User A can still accept it — but User B will not appear in User A's contact list until User A also unblocks them. Accepting a request does not auto-unblock.
