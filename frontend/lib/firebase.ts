import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // ✅ add this
const firebaseConfig = {
  apiKey: "AIzaSyDLNWd7XwCvHUpZRn-Ar6_08pni29PQX_s",
  authDomain: "gullak-89a64.firebaseapp.com",
  projectId: "gullak-89a64",
  storageBucket: "gullak-89a64.firebasestorage.app",
  messagingSenderId: "226259637737",
  appId: "1:226259637737:web:57b3f8a3725213a10ca778",
  measurementId: "G-FMWBEZ9B9H"
};
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage = getStorage(app); // ✅ export storage