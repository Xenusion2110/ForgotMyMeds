// services/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDQp6ZaMEQAt6ggkaRApk1GS2xtsOIQEts",
  authDomain: "forgotmymeds-3693f.firebaseapp.com",
  projectId: "forgotmymeds-3693f",
  storageBucket: "forgotmymeds-3693f.firebasestorage.app",
  messagingSenderId: "296867118292",
  appId: "1:296867118292:web:185aedd57988645f4d8f41"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (err) {
    if (err?.code === "auth/already-initialized") {
      return getAuth(app);
    }

    throw err;
  }
})();

export const functions = getFunctions(app);

export const callFunction = async (name, data = {}, options = {}) => {
  const callable = httpsCallable(functions, name);
  const idToken =
    options.idToken ||
    (await auth.currentUser?.getIdToken(options.forceRefresh ?? false));

  return callable(idToken ? { ...data, idToken } : data);
};
