// services/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQp6ZaMEQAt6ggkaRApk1GS2xtsOIQEts",
  authDomain: "forgotmymeds-3693f.firebaseapp.com",
  projectId: "forgotmymeds-3693f",
  storageBucket: "forgotmymeds-3693f.firebasestorage.app",
  messagingSenderId: "296867118292",
  appId: "1:296867118292:web:185aedd57988645f4d8f41"
};

// ✅ Prevent "Firebase App named '[DEFAULT]' already exists"
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Export Auth for your screens to use
export const auth = getAuth(app);
