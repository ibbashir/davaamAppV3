import { initializeApp} from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase's *web* config (Firebase console > Project settings > General).
//
// These are checked in on purpose. Unlike a server key, the web config is a
// public client identifier: Firebase inlines it into the browser bundle, so it
// is readable by anyone using the site whatever we do here, and moving it to a
// VITE_ env var would only inline the same string from somewhere else. The
// project is protected by the Storage rules and the API key restrictions in the
// Google Cloud console instead.
//
// Netlify's secret scanner flags the apiKey anyway; netlify.toml exempts that
// one value. The service-account key for the *admin* SDK is a real secret and
// belongs nowhere near this file.
//
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


export const firebaseApp = initializeApp(firebaseConfig);
export const storage = getStorage(firebaseApp);


/** Uploads a single file to Firebase Storage and resolves its public download URL. */
export async function uploadFileToFirebase(file: File, folder = "outreach"): Promise<string> {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
