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

export const hasCurrentUser = () => {
  return (auth.currentUser)? true : false;
}

export const sendEmailVerification = (callback) => {
  if(auth.currentUser)
    return auth.currentUser.sendEmailVerification().then(() => {
      callback();
    });
  return new Promise((resolve, reject) => {
    throw Error('Permission Denied. User not logged in');
  })
}

export const currentUserEmailVerified = () => {
  if(auth.currentUser)
    return auth.currentUser.emailVerified;
  else return false;
}

export const removeAccount = () => {
  if(!auth.currentUser)
    return new Promise((resolve, reject) => {
      throw Error('Permission Denied. User not logged in');
    });
  return auth.currentUser.delete();
}