import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics - only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Listen for auth state changes and update user data in Firestore
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await createOrUpdateUserInFirestore(user);
  }
});

// Create or update user document in Firestore
export async function createOrUpdateUserInFirestore(user: User) {
  if (!user.uid) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create new user document
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      status: 'online',
      friends: []
    });
  } else {
    // Just update the lastActive and status
    await updateDoc(userRef, {
      lastActive: serverTimestamp(),
      status: 'online'
    });
  }
}

// Set user status to offline when they sign out or window closes
export function setupAuthListeners() {
  // Update status when tab/window closes
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          status: 'offline',
          lastActive: serverTimestamp()
        });
      }
    });
  }
  
  // Listen for sign out to update status
  onAuthStateChanged(auth, async (user) => {
    if (!user && auth.currentUser === null) {
      // User signed out, last user is stored in sessionStorage
      const lastUid = sessionStorage.getItem('lastUid');
      if (lastUid) {
        const userRef = doc(db, 'users', lastUid);
        await updateDoc(userRef, {
          status: 'offline',
          lastActive: serverTimestamp()
        });
        sessionStorage.removeItem('lastUid');
      }
    } else if (user) {
      // Store current user ID in sessionStorage
      sessionStorage.setItem('lastUid', user.uid);
    }
  });
}

export { auth, googleProvider, githubProvider, analytics, db, storage }; 