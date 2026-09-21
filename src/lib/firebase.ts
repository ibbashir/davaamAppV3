import { initializeApp} from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Values come from a local .env (gitignored) — see .env.example for the keys
// to fill in from the Firebase console (Project settings > General > Your apps).
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRVg4hfeqd1-9VLInPNpsU3BTRasgmSeI",
  authDomain: "davaamlife-33233.firebaseapp.com",
  projectId: "davaamlife-33233",
  storageBucket: "davaamlife-33233.appspot.com",
  messagingSenderId: "359523720294",
  appId: "1:359523720294:web:d32dc42ccd00b451fa61a7",
  measurementId: "G-Z45CQ1J9CW"
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
