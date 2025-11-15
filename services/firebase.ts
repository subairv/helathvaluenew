import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import type { HealthData } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCoX4RT3aJW-frI0y-Re8anJ27iMxdZpmE",
  authDomain: "healthvalue-14223.firebaseapp.com",
  projectId: "healthvalue-14223",
  storageBucket: "healthvalue-14223.firebasestorage.app",
  messagingSenderId: "534128607346",
  appId: "1:534128607346:web:5040b70ae50c08656302eb"
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = (): Promise<void> => {
  return signInWithPopup(auth, provider).then(() => {}).catch((error) => {
    console.error("Google Sign-In Error:", error);
  });
};

export const signOutUser = (): Promise<void> => {
  return signOut(auth);
};

export const saveHealthData = async (userId: string, date: string, data: HealthData): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'healthRecords', date);
  await setDoc(docRef, data, { merge: true });
};

export const getHealthDataForDate = async (userId: string, date: string): Promise<HealthData | null> => {
  const docRef = doc(db, 'users', userId, 'healthRecords', date);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as HealthData) : null;
};


export { onAuthStateChanged };
