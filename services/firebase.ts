import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, deleteDoc, addDoc, writeBatch } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import type { HealthData, HealthRecord, Customer } from "../types";

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

// Customer Management
export const getCustomers = async (userId: string): Promise<Customer[]> => {
    const customersColRef = collection(db, 'users', userId, 'customers');
    const q = query(customersColRef, orderBy('lastName'), orderBy('firstName'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

export const saveCustomer = async (userId: string, customer: Omit<Partial<Customer>, 'id'> & { id?: string }): Promise<string> => {
    if (customer.id) {
        const customerId = customer.id;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...customerData } = customer;
        const customerDocRef = doc(db, 'users', userId, 'customers', customerId);
        await setDoc(customerDocRef, customerData, { merge: true });
        return customerId;
    } else {
        const customersColRef = collection(db, 'users', userId, 'customers');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...customerData } = customer;
        const docRef = await addDoc(customersColRef, customerData);
        return docRef.id;
    }
};

export const deleteCustomer = async (userId: string, customerId: string): Promise<void> => {
    const batch = writeBatch(db);
    
    // Delete all health records for the customer
    const recordsColRef = collection(db, 'users', userId, 'customers', customerId, 'healthRecords');
    const recordsSnapshot = await getDocs(recordsColRef);
    recordsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Delete the customer document
    const customerDocRef = doc(db, 'users', userId, 'customers', customerId);
    batch.delete(customerDocRef);
    
    await batch.commit();
};


// Health Record Management (now customer-specific)
export const saveHealthData = async (userId: string, customerId: string, date: string, data: HealthData, customer: Customer): Promise<void> => {
    const isToday = new Date().toISOString().split('T')[0] === date;

    const batch = writeBatch(db);

    const recordDocRef = doc(db, 'users', userId, 'customers', customerId, 'healthRecords', date);
    batch.set(recordDocRef, data, { merge: true });
    
    const customerHasChanged = data.weight !== customer.currentWeightKg || data.height !== customer.heightCm;

    if (isToday && customerHasChanged) {
        const customerDocRef = doc(db, 'users', userId, 'customers', customerId);
        const customerUpdate: Partial<Customer> = {};
        if (data.weight !== undefined) {
            customerUpdate.currentWeightKg = data.weight;
        }
        if (data.height !== undefined) {
            customerUpdate.heightCm = data.height;
        }
        batch.update(customerDocRef, customerUpdate);
    }
    
    await batch.commit();
};

export const getHealthDataForDate = async (userId: string, customerId: string, date: string): Promise<HealthData | null> => {
  const docRef = doc(db, 'users', userId, 'customers', customerId, 'healthRecords', date);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as HealthData) : null;
};

export const getAllHealthRecords = async (userId: string, customerId: string): Promise<HealthRecord[]> => {
  const recordsColRef = collection(db, 'users', userId, 'customers', customerId, 'healthRecords');
  const q = query(recordsColRef, orderBy('__name__', 'desc')); // Order by document ID (date) descending
  const querySnapshot = await getDocs(q);
  const records: HealthRecord[] = [];
  querySnapshot.forEach((doc) => {
    records.push({ id: doc.id, ...doc.data() } as HealthRecord);
  });
  return records;
};

export const deleteHealthRecord = async (userId: string, customerId: string, date: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, 'customers', customerId, 'healthRecords', date);
    await deleteDoc(docRef);
};


export { onAuthStateChanged };
