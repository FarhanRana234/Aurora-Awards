import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAWX7YAv0aD3xqA417IZ6y-MtU8-DpIVRQ",
  authDomain: "aurora-awards-by-fj.firebaseapp.com",
  projectId: "aurora-awards-by-fj",
  storageBucket: "aurora-awards-by-fj.firebasestorage.app",
  messagingSenderId: "938893054490",
  appId: "1:938893054490:web:5653001eb1165e7c3d37a3",
  measurementId: "G-XTYN7STM6Z"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
