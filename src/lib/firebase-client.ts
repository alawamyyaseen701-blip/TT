import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD0-UIHuPAotYJXvwLogNhyUZ-THkJFGKs",
  authDomain: "trustdeal-cd554.firebaseapp.com",
  projectId: "trustdeal-cd554",
  storageBucket: "trustdeal-cd554.firebasestorage.app",
  messagingSenderId: "219074232918",
  appId: "1:219074232918:web:cfd5bc25ec831471cc31f7",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, googleProvider, signInWithPopup };
