import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB1WwvlySKr46XnoVUBSG_LiuEqvlt02uE",
  authDomain: "gb-plan.firebaseapp.com",
  projectId: "gb-plan",
  storageBucket: "gb-plan.firebasestorage.app",
  messagingSenderId: "223820216897",
  appId: "1:223820216897:web:e3315a0d6727b083cfa4c0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
