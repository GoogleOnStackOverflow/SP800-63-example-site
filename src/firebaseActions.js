import * as firebase from 'firebase';
import { firebaseConfig } from './config';

var app = firebase.initializeApp(firebaseConfig);
var auth = app.auth();
var db = app.database();

export const registerWithEmail = (email, password) => {
  return auth.createUserWithEmailAndPassword(email, password);
}

export const loginWithEmailPwd = (email, password) => {
  return auth.signInWithEmailAndPassword(email, password);
}

export const logout = (callback) => {
  return auth.signOut().then(()=>{callback()})
}

export const sendEmailVerification = (callback) => {
  // [START sendemailverification]
  auth.currentUser.sendEmailVerification().then(() => {
    callback();
  });
}