
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB0NoC46J4Q-rtY3B2zVtRaU1lZGkWY9rk",
  authDomain: "taskflowai-7fe2c.firebaseapp.com",
  projectId: "taskflowai-7fe2c",
  storageBucket: "taskflowai-7fe2c.firebasestorage.app",
  messagingSenderId: "600503488943",
  appId: "1:600503488943:web:ec016ceb4167a643165f5a",
  measurementId: "G-9Z03H47FG4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
