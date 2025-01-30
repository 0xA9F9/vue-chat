import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
    apiKey: "AIzaSyBtU1l_2JNsjU1vNl2RSyEaTMdSWq1be9s",
    authDomain: "pirate-san.firebaseapp.com",
    databaseURL: "https://pirate-san-default-rtdb.firebaseio.com",
    projectId: "pirate-san",
    storageBucket: "pirate-san.appspot.com",
    messagingSenderId: "557131859217",
    appId: "1:557131859217:web:7509be815155c2b88278b0",
    measurementId: "G-ZXHLG0WCKF"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); 
