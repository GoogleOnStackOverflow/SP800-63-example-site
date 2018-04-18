import * as firebase from 'firebase'
import * as sha256 from 'sha256'
import * as speakeasy from 'speakeasy'
import { firebaseConfig } from './config'
import userActions from './userActions'

var app = firebase.initializeApp(firebaseConfig);
var auth = app.auth();
var db = app.database();
var storageRef = app.storage().ref();

const fetchFirebaseFunction = (operation, queryObject, fetchOptions) => {
  const apiurl = 'https://us-central1-sp800-63-example-site.cloudfunctions.net/';
  let queryArr = Object.keys(queryObject).map(key => {
    return `${key}=${JSON.stringify(queryObject[key])}`;
  })

  let fetchurl = `${apiurl}${operation}?`
  for(let i=0; i < queryArr.length -1; i++){
    fetchurl += `${queryArr[i]}&`;
  }
  fetchurl += queryArr[queryArr.length-1];

  return fetch(fetchurl, fetchOptions);
}

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

export const setCurrentUserPII = (data) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    else {
      auth.currentUser.getIdToken(true).then(tkn => {
        fetchFirebaseFunction('setuserpii', {usr: tkn, pii: data}).then((res) => {
          res.text().then(text => {
            if(res.status === 200)
              resolve();
            else
              reject(Error(text));
            })
        })
      }).catch(err => {
        reject(err);
      })
    }
  })
}

export const currentUserPIISet = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    else 
      auth.currentUser.getIdToken(true).then(tkn => {
        fetchFirebaseFunction('userpiiset', {usr: tkn}).then(res => {
          if(res.status === 200)
            res.text().then(text => {
              let result = JSON.parse(text);
              resolve(result);
            });
          else
            res.text().then(text => {
              reject(Error(text));  
            })
        });
      }).catch(err => {
        reject(err);
      })
  });
}

export const removeUserInfo = (email) => {
  return db.ref('/users/'+sha256(email)).set({});
}

export const setCurrentUserOTP = (credential) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('setotpcredential', {usr: tkn, credential: encodeURIComponent(credential)}).then(res => {
        if(res.status === 200)
          resolve();
        else
          res.text().then(text => {
            reject(Error(text));  
          })
      });
    }).catch(err => {
      reject(err);
    })
  });
}

export const getCurrentUserPhone = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));

    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('getusrphone', {usr: tkn}).then(res => {
        res.text().then(result => {
          if(res.status === 200)
            resolve(JSON.parse(result));
          else
            reject(Error(result));
        })
      })
    }).catch(err => {
      reject(err);
    })
  })
}

export const thePhoneNumberUsed = (phone) => {
  return new Promise((resolve, reject) => {
    fetchFirebaseFunction('phoneusedup', {phone}).then(res => {
      res.text().then(result => {
        if(res.status === 200)
          resolve(JSON.parse(result));
        else
          reject(Error(result));
      })
    })
  });
}

export const currentUserEvidenceUploaded = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('userevidenceuploaded', {usr: tkn}).then(res => {
        res.text().then(result => {
          if(res.status === 200) {
            resolve(JSON.parse(result));
          } else {
            reject(result);
          }
        }) 
      })
    }).catch(err => {
      reject(err);
    })
  })
}

export const currentUserPIIVerified = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('userpiiverified', {usr: tkn}).then(res => {
        res.text().then(result => {
          if(res.status === 200) {
            resolve(JSON.parse(result));
          } else {
            reject(result);
          }
        }) 
      })
    }).catch(err => {
      reject(err);
    })
  })
}

export const currentUserPhoneVerified = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('userphoneverified', {usr: tkn}).then(res => {
        res.text().then(result => {
          if(res.status === 200) {
            resolve(JSON.parse(result));
          } else {
            reject(result);
          }
        }) 
      })
    }).catch(err => {
      reject(err);
    })
  })
}

export const currentUserOTPDelivered = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('otpdeliverd', {usr: tkn}).then(res => {
        res.text().then(result => {
          if(res.status === 200) {
            resolve(JSON.parse(result));
          } else {
            reject(result);
          }
        }) 
      })
    }).catch(err => {
      reject(err);
    })
  })
}

// Auth functions
// helpers
export const hasCurrentUser = () => {
  auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
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

// TODO
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
    db.ref('/users/'+sha256(email)+'/pwdFailedCounter').once('value').then(snapshot => {
      if(!snapshot || !snapshot.val() || snapshot.val() <= 5)
        auth.signInWithEmailAndPassword(email, password).then(() => {
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
      else
        reject(Error('Permission denied. Wrong password trial limit reached'));
    }).catch(err => reject(err))
  }) 
}

export const loginWithOTP = (otp) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'))
    auth.currentUser.getIdToken(true).then(tkn => {
      fetchFirebaseFunction('otpverifier', 
        {usr: tkn, tkn: otp},
        {method: 'POST', mode: 'cors'}
      ).then((res)=> {
        res.text().then(text => {
          if(res.status === 200){
            auth.signInWithCustomToken(text).then(() => {
              //localStorage.setItem('otptkn', text);
              resolve();
            }).catch(err => {
              reject(err);
            });
          } else
          reject(Error(text))
        });
      })
    }).catch(err => {
      reject(err);
    })
  });
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