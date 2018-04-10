import * as firebase from 'firebase'
import * as sha256 from 'sha256'
import * as speakeasy from 'speakeasy'
import { firebaseConfig } from './config'
import userActions from './userActions'

var app = firebase.initializeApp(firebaseConfig);
var auth = app.auth();
var db = app.database();
var storageRef = app.storage().ref();

// DB functions
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

export const editCurrentUserPII = (data) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    else {
      let email = auth.currentUser.email;
      db.ref('/users/'+sha256(email)+'/pii').set(data).then(() => {
        recordUserEvent(userActions.PII_EDITED).then(() => {
          db.ref('/users/'+sha256(email)+'/piiVerified').set(false).then(() => {
            resolve();
          }).catch(err => {
            reject(err);
          })
        }).catch(err => {
          reject(err);
        })
      }).catch(err => {
        reject(err);
      })
    }
  })
}

export const getUserInfoFromDbPromise = () => {
  if(!auth.currentUser)
    return new Promise((resolve, reject) => {
      resolve(undefined);
    });
  return db.ref('/users/'+sha256(auth.currentUser.email)).once('value')
}

export const removeUserInfo = (email) => {
  return db.ref('/users/'+sha256(email)).set({});
}

export const setCurrentUserOTP = (credential) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    db.ref('/users/'+sha256(auth.currentUser.email)+'/otpCredential').set(credential).then(() => {
      recordUserEvent(userActions.OTP_DELIVERIED).then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      })
    }).catch(err => {
      reject(err);
    })
  });
}

export const resetCurrentUserOTP = (credential) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    db.ref('/users/'+sha256(auth.currentUser.email)+'/otpCredential').set(credential).then(() => {
      recordUserEvent(userActions.OTP_RESET).then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      })
    }).catch(err => {
      reject(err);
    })
  });
}

// Auth functions
// helpers
export const hasCurrentUser = () => {
  return (auth.currentUser)? true : false;
}

export const getCurrentUserEmail = () => {
  return (auth.currentUser)? auth.currentUser.email : undefined;
}

// Registration
export const registerWithEmail = (email, password) => {
  return auth.createUserWithEmailAndPassword(email, password);
}

export const sendEmailVerification = (callback) => {
  if(auth.currentUser)
    return auth.currentUser.sendEmailVerification().then(() => {
      recordUserEvent(userActions.EMAIL_VERIFICATION_SENT).then(() => {
        callback();  
      })
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

export const sendPhoneVerificationCode = (phoneNumber) => {
  return new Promise((resolve, reject) => {
    auth.signInWithPhoneNumber('+886'+phoneNumber, window.recaptchaVerifier)
    .then((confirmationResult) => {
      resolve(confirmationResult);
    }).catch(err => {
      reject(err);
    })
  })
}

export const verifySMSCode = (code, confirmationResult) => {
  return new Promise((resolve, reject) => {
    let credential = firebase.auth.PhoneAuthProvider.credential(confirmationResult.verificationId, code);
    auth.currentUser.linkWithCredential(credential).then(function(user) {
      recordUserEvent(userActions.PHONE_VERIFIED).then(() => {
        db.ref('/users/'+sha256(auth.currentUser.email)+'/userPhoneVerified')
        .set(true).then(() => {
          resolve();
        }).catch(err => {
          reject(err);
        })
      }).catch(err => {
        reject(err);
      })
    }, function(error) {
      reject(error);
    });
  })
}

// Sign in / Sing out
export const loginWithEmailPwd = (email, password) => {
  return new Promise((resolve, reject) => {
    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      recordUserEvent(userActions.PWD_LOGIN_SUCCESS).then(()=> {
        resolve();
      })
    })
    .catch(err => {
      if(err.code === 'auth/wrong-password') {
        recordUserEvent(userActions.PWD_LOGIN_FAILED, email).then(() => {
          reject(err);
        })
      } else {
        reject(err);
      }
    })
  }) 
}

export const loginWithOTP = (otp, email) => {
  return new Promise((resolve, reject) => {
    if(!email && !auth.currentUser)
      reject(Error('Permission Denied. User not logged in'))
    if(!email)
      email = auth.currentUser.email;
    email = encodeURIComponent(email);
    fetch(`https://us-central1-sp800-63-example-site.cloudfunctions.net/otpverifier?usr=${email}&tkn=${otp}`).then((res)=> {
      if(res.status === 200) {
        resolve();
      } else if(res.status === 400) {
        reject(Error('OTP verification failed'));
      } else {
        reject(Error(res.text()));
      }
    }).catch(err => {
      reject(err);
    })
  })
}

export const logout = (callback) => {
  return auth.signOut().then(()=>{callback()})
}

// Remove
export const removeAccount = () => {
  if(!auth.currentUser)
    return new Promise((resolve, reject) => {
      throw Error('Permission Denied. User not logged in');
    });
  return auth.currentUser.delete();
}

// Storage functions
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
      })).then(
        recordUserEvent(userActions.EVIDENCE_UPLOADED).then(()=> {
          resolve();
        })
      );
    }).catch(err => {
      console.error(err);
      throw err;
    })
  });
}

export const removeUserStorage = (email) => {
  var userRef = storageRef.child('/userEvidence/'+sha256(auth.currentUser.email));
  return new Promise((resolve, reject) => {
    Promise.all([0,1,2].map(index => {
      return userRef.child(`/Evidence${index}`).delete();
    }))
    .then(resolve())
    .catch(err => {
      throw err;
    })
  })
}

//helpers
export const removeAllCurrentAccountData = () => {
  if(!auth.currentUser)
    return new Promise((resolve, reject) => {
      throw Error('Permission Denied. User not logged in');
    });

  let mail = auth.currentUser.email;
  return new Promise((resolve, reject) => {
    Promise.all([
      removeUserStorage(mail), 
      removeUserInfo(mail), 
      removeAccount()])
    .then(resolve())
    .catch(err => {
      throw err;
    })
  });
}

export const generateOTPKeyAndQRCode = (accountName) => {
  if(!accountName && auth.currentUser)
    accountName = auth.currentUser.email;
  let issuer = 'SP800-63-Example'
  let secret = speakeasy.generateSecret();

  return [
    secret.ascii,
    `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${encodeURIComponent(secret.base32)}&issuer=${encodeURIComponent(issuer)}`,
    secret.base32
  ]
}

export const verifyOTP = (otp, key) => {
  console.log(`key: ${key}, otp: ${otp}`);
  
  return speakeasy.totp.verify({ 
    secret: key,
    token: otp });
}