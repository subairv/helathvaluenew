
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { Auth } from "firebase/auth";

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
const provider = new GoogleAuthProvider();

export const signInWithGoogle = (): Promise<void> => {
  return signInWithPopup(auth, provider).then(() => {}).catch((error) => {
    console.error("Google Sign-In Error:", error);
  });
};

export const signOutUser = (): Promise<void> => {
  return signOut(auth);
};

export { onAuthStateChanged };
