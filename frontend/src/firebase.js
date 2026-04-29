import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDYF9eGuOHZv2YY0_lOsN-mE0qNWt_icU0",
  authDomain: "hethongcanhbaodien.firebaseapp.com",
  databaseURL: "https://hethongcanhbaodien-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hethongcanhbaodien",
  storageBucket: "hethongcanhbaodien.firebasestorage.app",
  messagingSenderId: "954409445146",
  appId: "1:954409445146:web:8b604133e1a10cb89c2ea3",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
