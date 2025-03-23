import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBXP4gG-ScTkV2x5vRWW9ac7g-3KMxVw1k",
  authDomain: "myapp-6aa05.firebaseapp.com",
  projectId: "myapp-6aa05",
  storageBucket: "myapp-6aa05.firebasestorage.app",
  messagingSenderId: "560038021116",
  appId: "1:560038021116:web:619dfe8afd2d1abd539479",
  measurementId: "G-VRL7P8RV68",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
