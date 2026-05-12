import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBujOBV9x4cUnNfk5Pg3T0Z01AMx4CjJvA",
  authDomain: "tvindoor-53755.firebaseapp.com",
  projectId: "tvindoor-53755",
  storageBucket: "tvindoor-53755.firebasestorage.app",
  messagingSenderId: "382047154463",
  appId: "1:382047154463:web:d38923fba7d825d5c4002a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
