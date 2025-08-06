// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyA6UeVbO46lCVvTW0CdFbmvpuu1lfG5bn4",
    authDomain: "ref-assistant-clean.firebaseapp.com",
    projectId: "ref-assistant-clean",
    storageBucket: "ref-assistant-clean.firebasestorage.app",
    messagingSenderId: "551093175028",
    appId: "1:551093175028:web:00ecb556ce6dc10f8054a1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
