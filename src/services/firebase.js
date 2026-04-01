// src/services/firebase.js — Firebase client SDK setup
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  multiFactor,
  PhoneMultiFactorGenerator,
  PhoneAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── Auth helpers ───────────────────────────────────────────

export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const sendVerification = () =>
  sendEmailVerification(auth.currentUser);

export const subscribeToAuth = (callback) =>
  onAuthStateChanged(auth, callback);

/**
 * Get the current user's ID token for API requests.
 * Force refresh if token is close to expiry.
 */
export const getIdToken = async (forceRefresh = false) => {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
};

// ── Firestore real-time subscriptions ─────────────────────

/**
 * Subscribe to all issues (real-time).
 * @param {function} callback — called with issues array on every update
 */
export const subscribeToIssues = (callback, filters = {}) => {
  let q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(100));
  if (filters.category) q = query(q, where('category', '==', filters.category));
  if (filters.status) q = query(q, where('status', '==', filters.status));

  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

/**
 * Subscribe to comments on a specific issue (real-time).
 */
export const subscribeToComments = (issueId, callback) => {
  const q = query(
    collection(db, 'issues', issueId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

/**
 * Subscribe to chat messages in a room (real-time).
 */
export const subscribeToChatRoom = (room, callback) => {
  const q = query(
    collection(db, 'chat_messages', room, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
  });
};

export { serverTimestamp, collection, doc, getDoc, getDocs, addDoc, updateDoc };
