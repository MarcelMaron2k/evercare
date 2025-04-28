// firebase.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyCYdXpIpZeVNF--7BDO_nzTFv6h9jWO58s",
  authDomain:        "evercare-cff66.firebaseapp.com",
  projectId:         "evercare-cff66",
  storageBucket:     "evercare-cff66.appspot.com",
  messagingSenderId: "742883445590",
  appId:             "1:742883445590:web:bb2ebaebe02eaebe02ea07064e4f7",
};

// initialize once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// named exports for your screens
export const auth = firebase.auth();
export const db   = firebase.firestore();

// default export if you ever need the full namespace
export default firebase;
