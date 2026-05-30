import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await sendEmailVerification(credential.user);
  } catch (err) {
    console.error("[sendEmailVerification error]", err);
  }
  return credential;
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export async function sendPasswordResetEmail(email: string) {
  return firebaseSendPasswordResetEmail(auth, email);
}
