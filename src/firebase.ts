import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0060353187",
  appId: "1:798884137211:web:b83ac0a44e025862bd885e",
  apiKey: "AIzaSyCGRu6Y8af1udUC78bkBYPgTOm2yRI5YwQ",
  authDomain: "gen-lang-client-0060353187.firebaseapp.com",
  storageBucket: "gen-lang-client-0060353187.firebasestorage.app",
  messagingSenderId: "798884137211"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific database ID created by the setup tool
const db = getFirestore(app, "ai-studio-6a5e4293-7427-45c3-9710-a9e84638a1f4");

export { app, db };
