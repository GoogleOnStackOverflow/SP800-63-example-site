import * as firebase from 'firebase';
import * as sha256 from 'sha256';
import { firebaseConfig } from './config';

var app = firebase.initializeApp(firebaseConfig);
var auth = app.auth();
var db = app.database();
var storageRef = app.storage().ref();

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

export const recordUserEvent = (name, email) => {
  if(!email) {
    if(!auth.currentUser)
      return new Promise((resolve, reject) => {
        throw Error('Permission Denied. User not logged in');
      });
    else
      email = auth.currentUser.email;
  }

  var d = new Date();
  return db.ref('/users/'+sha256(email)+'/events/'+d).set({name});
}

export const uploadUserEvidences = (images) => {
  if(!auth.currentUser)
    return new Promise((resolve, reject) => {
      throw Error('Permission Denied. User not logged in');
    });
  return new Promise((resolve,reject)=> {
    db.ref('/users/'+sha256(auth.currentUser.email)+'/evidenceUploaded')
    .set(true)
    .then(()=> {
      var userRef = storageRef.child('/userEvidence/'+sha256(auth.currentUser.email));
      Promise.all(images.map((file, index) => {
        return userRef.child(`/Evidence${index}`).put(file)
      })).then(resolve());
    }).catch(err => {
      console.error(err);
      throw err;
    })
  });
}

export const getUserInfoFromDbPromise = () => {
  if(!auth.currentUser)
    return new Promise((resolve, reject) => {
      resolve(undefined);
    });
  return db.ref('/users/'+sha256(auth.currentUser.email)).once('value')
}