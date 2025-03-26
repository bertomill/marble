// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB__b8_jkmtgzaG2bnfY6khZ9_ehzBoDcs",
  authDomain: "sitestack-30e64.firebaseapp.com",
  projectId: "sitestack-30e64",
  storageBucket: "sitestack-30e64.firebasestorage.app",
  messagingSenderId: "478001917597",
  appId: "1:478001917597:web:5f99270cdd512de9d96e74",
  measurementId: "G-SZHFKG0C5L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { auth, db, googleProvider, analytics, storage }; 