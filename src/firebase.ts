import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import type { Device, Account } from './types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = () => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase configuration:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate before initializing
validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to sign in' 
    };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to sign out' 
    };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Data sync functions
export const pushAllData = async (devices: Device[], accounts: Account[]) => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Delete existing data
    const devicesSnapshot = await getDocs(collection(db, 'devices'));
    const accountsSnapshot = await getDocs(collection(db, 'accounts'));

    await Promise.all([
      ...devicesSnapshot.docs.map(d => deleteDoc(d.ref)),
      ...accountsSnapshot.docs.map(d => deleteDoc(d.ref))
    ]);

    // Push new data
    await Promise.all([
      ...devices.map(device =>
        setDoc(doc(db, 'devices', device.id), device)
      ),
      ...accounts.map(account =>
        setDoc(doc(db, 'accounts', account.id), account)
      )
    ]);

    return { success: true, message: 'Data pushed to cloud successfully' };
  } catch (error: any) {
    console.error('Push error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to push data to cloud' 
    };
  }
};

export const pullAllData = async (): Promise<{ 
  success: boolean; 
  devices?: Device[]; 
  accounts?: Account[]; 
  error?: string;
}> => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const devicesSnapshot = await getDocs(collection(db, 'devices'));
    const accountsSnapshot = await getDocs(collection(db, 'accounts'));

    const devices = devicesSnapshot.docs.map(doc => doc.data() as Device);
    const accounts = accountsSnapshot.docs.map(doc => doc.data() as Account);

    return { success: true, devices, accounts };
  } catch (error: any) {
    console.error('Pull error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to pull data from cloud' 
    };
  }
};
