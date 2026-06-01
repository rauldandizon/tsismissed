import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { addContact } from "./contacts";
import type { ContactRequest } from "@/types/contactRequest";
import type { UserProfile } from "@/types/user";

export async function sendContactRequest(
  fromUid: string,
  fromDisplayName: string,
  fromEmail: string,
  fromPhotoURL: string | null | undefined,
  fromBio: string,
  toUid: string
): Promise<void> {
  const ref = doc(db, "users", toUid, "contactRequests", fromUid);
  await setDoc(ref, {
    fromUid,
    fromDisplayName,
    fromEmail,
    fromPhotoURL: fromPhotoURL ?? "",
    fromBio,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getOutgoingRequestStatus(
  currentUid: string,
  targetUid: string
): Promise<"pending" | "declined" | null> {
  const ref = doc(db, "users", targetUid, "contactRequests", currentUid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return (snap.data() as ContactRequest).status;
}

export async function acceptContactRequest(
  currentUid: string,
  currentProfile: Pick<UserProfile, "uid" | "displayName" | "email" | "photoURL" | "bio">,
  request: ContactRequest
): Promise<void> {
  // Build both contact records from data we already hold — the request carries
  // the sender's denormalized profile, and the current user's profile is passed
  // in. Avoids re-reading user docs (which previously threw "User not found"
  // when a user doc was missing or a read came back stale).
  await addContact(currentUid, {
    uid: request.fromUid,
    displayName: request.fromDisplayName,
    email: request.fromEmail,
    photoURL: request.fromPhotoURL,
    bio: request.fromBio,
  } as UserProfile);

  // Add the current user into the sender's contacts. This cross-user write is
  // only permitted while the request doc still exists, so do it BEFORE delete.
  await addContact(request.fromUid, {
    uid: currentProfile.uid,
    displayName: currentProfile.displayName,
    email: currentProfile.email,
    photoURL: currentProfile.photoURL,
    bio: currentProfile.bio,
  } as UserProfile);

  await deleteDoc(doc(db, "users", currentUid, "contactRequests", request.fromUid));
}

export async function declineContactRequest(
  currentUid: string,
  fromUid: string
): Promise<void> {
  await updateDoc(doc(db, "users", currentUid, "contactRequests", fromUid), {
    status: "declined",
  });
}

export function subscribeIncomingRequests(
  uid: string,
  cb: (requests: ContactRequest[]) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "contactRequests"),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data() } as ContactRequest)));
  });
}
