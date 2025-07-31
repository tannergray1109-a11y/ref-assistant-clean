// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCa_QlgP14-ZHaZslG1JN0jLtSUYtxlUNE",
    authDomain: "sample-firebase-ai-app-a3ded.firebaseapp.com",
    projectId: "sample-firebase-ai-app-a3ded",
    storageBucket: "sample-firebase-ai-app-a3ded.firebasestorage.app",
    messagingSenderId: "551093175028",
    appId: "1:551093175028:web:00ecb556ce6dc10f8054a1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
