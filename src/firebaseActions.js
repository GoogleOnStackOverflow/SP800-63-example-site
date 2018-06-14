import * as firebase from 'firebase'
import * as sha256 from 'sha256'
import * as speakeasy from 'speakeasy'
import { firebaseConfig } from './config'
import userActions from './userActions'

var app = firebase.initializeApp(firebaseConfig);
var auth = app.auth();
var db = app.database();
var storageRef = app.storage().ref();

const mapObjectToQueryString = (queryObject) => {
  let fetchurl = '?';
  let queryArr = Object.keys(queryObject).map(key => {
    return `${key}=${JSON.stringify(queryObject[key])}`;
  })

  for(let i=0; i < queryArr.length -1; i++){
    fetchurl += `${queryArr[i]}&`;
  }
  fetchurl += queryArr[queryArr.length-1];

  return fetchurl;
}

const fetchFirebaseFunction = (operation, queryObject, fetchOptions) => {
  const apiurl = 'https://us-central1-sp800-63-example-site.cloudfunctions.net/';
  let fetchurl = `${apiurl}${operation}${mapObjectToQueryString(queryObject)}`

  return fetch(fetchurl, fetchOptions);
}

// DB functions
export const currentUserAdmin = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    db.ref('/adminTester').once('value').then(snapshot => {
      resolve();
    }).catch(err => {
      reject(err);
    })
  })
}

export const getAllNotVerifiedUsers = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    db.ref('/users').once('value').then(snapshot => {
      let result = snapshot.val();
      Promise.all(
        Object.keys(result).map(userid => {
          return new Promise((res, rej) => {
            if(result[userid].evidenceUploaded && !result[userid].piiVerified) {
              let userRef = storageRef.child(`/userEvidence/${userid}`);
              Promise.all([0, 1, 2].map(index => {
                return userRef.child(`/Evidence${index}`).getDownloadURL();
              })).then(urls => {
                res({
                  uid: userid,
                  verified: false,
                  FirstName: result[userid].pii.FirstName,
                  LastName: result[userid].pii.LastName,
                  Birthday: result[userid].pii.Birthday,
                  ID: result[userid].pii.ID,
                  e1: urls[0],
                  e2: urls[1],
                  e3: urls[2],
                })
              }, err => {
                if(err)
                  rej(err);
              })
            } else {
              res();
            }
          })
        })
      ).then(userDataArr => {
        let returnData = {};
        userDataArr.forEach(data => {
          if(data)
            returnData[data.uid] = data;
        })
        resolve(returnData);
      }, err => {
        reject(err);
      })
    }).catch(err => {
      reject(err);
    })
  })
}

export const setUserPiiVerified = (usr) => {
  return new Promise((resolve, reject) => {
    db.ref(`/users/${usr}/piiVerified`).set(true).then(()=> {
      resolve();
    }).catch(err => {
      reject(err);
    })
  })
}

export const recordUserEvent = (name, email) => {
  if(!email && !auth.currentUser)
    throw Error('Permission Denied. User not logged in');

  if(!email)
    email = auth.currentUser.email;
  
  let d = new Date();

  return db.ref(`/users/${sha256(email)}/events/${d}`).set({name})
}

export const setCurrentUserPII = (data) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    else {
      auth.currentUser.getIdToken(false).then(tkn => {
        return fetchFirebaseFunction('setuserpii', {usr: tkn, pii: data});
      }).then(res => {
        return Promise.all([res.status, res.text()]);
      }).then(result => {
        if(result[0] === 200)
          resolve();
        else
          reject(Error(result[1]));
      }).catch(err => {
        reject(err);
      })
    }
  })
}

export const editCurrentUserPII = (data) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    else {
      Promise.all(Object.keys(data).map(dataName => {
        return db.ref(`/users/${sha256(auth.currentUser.email)}/pii/${dataName}`).set(data[dataName]);
      })).then(() => {
        resolve();
      }, err => {
        reject(err);
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
      auth.currentUser.getIdToken(false).then(tkn => {
        return fetchFirebaseFunction('userpiiset', {usr: tkn});
      }).then(res => {
        return Promise.all([res.status, res.text()]);
      }).then(result => {
        if(result[0] === 200)
          resolve(JSON.parse(result[1]));
        else
          reject(Error(result[1]));
      }).catch(err => {
        reject(err);
      })
  });
}

export const getUserPII = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser){
      logout();
      reject(Error('Permission Denied'))
    }

    db.ref(`/users/${sha256(auth.currentUser.email)}/pii`).once('value').then(snapshot => {
      resolve(snapshot.val());
    }).catch(err => {
      //logout();
      reject(err);
    });
  })
}

export const setCurrentUserOTP = (credential) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('setotpcredential', {usr: tkn, credential: encodeURIComponent(credential)});
    }).then(res => {
      if(res.status === 200)
        resolve();
      else
        return res.text();
    }).then(text => {
      reject(Error(text));
    }).catch(err => {
      reject(err);
    })
  });
}

export const getCurrentUserPhone = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));

    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('getusrphone', {usr: tkn});
    }).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        resolve(JSON.parse(result[1]));
      else
        reject(Error(result[1]));
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
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('userevidenceuploaded', {usr: tkn});
    }).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        resolve(JSON.parse(result[1]));
      else
        reject(result[1]);
    }).catch(err => {
      reject(err);
    })
  });
}

export const currentUserPIIVerified = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('userpiiverified', {usr: tkn});
    }).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        resolve(JSON.parse(result[1]));
      else
        reject(result[1]);
    }).catch(err => {
      reject(err);
    })
  })
}

export const currentUserPhoneVerified = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('userphoneverified', {usr: tkn})
    }).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        resolve(JSON.parse(result[1]));
      else 
        reject(result[1]);
    }).catch(err => {
      reject(err);
    })
  });
}

export const currentUserOTPDelivered = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('otpdeliverd', {usr: tkn})
    }).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        resolve(JSON.parse(result[1]));
      else 
        reject(result[1]);
    }).catch(err => {
      reject(err);
    })
  });
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

export const sendEmailVerification = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    auth.currentUser.sendEmailVerification().then(() => {
      return recordUserEvent(userActions.EMAIL_VERIFICATION_SENT);
    }).then(() => resolve()
    ).catch(err => {
      reject(err);
    })
  });
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

    auth.currentUser.linkWithCredential(credential).then((user) => {
      return recordUserEvent(userActions.PHONE_VERIFIED);
    }).then(() => {
      return db.ref('/users/'+sha256(auth.currentUser.email)+'/userPhoneVerified').set(true);
    }).then(() => resolve()
    ).catch(err => reject(err));
  })
}

export const updateCurrentUserPhone = (phone, code, confirmationResult) => {
  return new Promise((resolve, reject) => {
    let credential = firebase.auth.PhoneAuthProvider.credential(confirmationResult.verificationId, code);

    auth.currentUser.updatePhoneNumber(credential).then(() => {
      return recordUserEvent(userActions.PHONE_EDITED);
    }).then(() => {
      return db.ref('/users/'+sha256(auth.currentUser.email)+'/pii/Phone').set(phone);
    }).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  })
}

export const updateCurrentUserPassword = (newPwd) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    getUserPII().then(() => {
      return auth.currentUser.updatePassword(newPwd);
    }, err => reject(err)).then(() => {
      return recordUserEvent(userActions.PWD_RESET)
    }).then(() => resolve(), err => reject(err))
    .catch(err => reject(err));
  })
}

export const updateCurrentUserOTP = (newCredential) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. Not logged in'));
    db.ref('/users/'+sha256(auth.currentUser.email)+'/otpCredential').set(newCredential).then(() => {
      return recordUserEvent(userActions.OTP_RESET);
    }).then(() => resolve()
    ).catch(err => reject(err))
  });
}

export const emailUnderRecover = (mail) => {
  return new Promise((resolve, reject) => {
    if(!mail)
      reject(Error('Data lost. Email not specified'));
    db.ref(`/users/${sha256(mail)}/underRecover`).once('value').then(snapshot => {
      if(snapshot.val())
        resolve(true);
      resolve(false)
    }).catch(err => {
      reject(err);
    })
  })
}

export const checkAndSendResetMail = (mail) => {
  return new Promise((resolve, reject) => {
    if(!mail)
      reject(Error('Data lost. Please fill all the forms and check you did not refresh the page before doing anything here'));
    emailUnderRecover(mail).then(result => {
      if(result)
        return `https://sp800-63-example-site.firebaseapp.com/resetphone${mapObjectToQueryString({email: mail})}`;
      else reject(Error('Permission Denied. Account not under recovery process.'));
    }, err => {
      reject(err);
    }).then(url => {
      return auth.sendSignInLinkToEmail(mail, {url, handleCodeInApp: true});
    }).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    });
  })
}

export const startRecoverProcess = (mail, id, birthday) => {
  return new Promise((resolve, reject) => {
    if(!mail || !id || !birthday)
      reject(Error('Data lost. Please fill all the forms and check you did not refresh the page before doing anything here'));
    fetchFirebaseFunction('markrecoverflag', {usr: sha256(mail), id, birthday}).then((res) => {
      if(res.status === 200)
        resolve(false);
      else if(res.status === 403)
        resolve(true);
      else 
        return res.text()
    }).then(text => {
      reject(Error(text));  
    }).catch(err => {
      reject(err);
    });
  })
}

export const stopRecoverProcess = (mail) => {
  return new Promise((resolve, reject) => {
    if(!mail)
      reject(Error('Data lost. Please fill all the forms and check you did not refresh the page before doing anything here'));
    emailUnderRecover(mail).then(result => {
      if(result)
        return fetchFirebaseFunction('markrecoverflag', {usr: sha256(mail)})
      else reject(Error('Permission Denied. Account does not exists or is not under recover.'));
    }, err => {
      reject(err);
    }).then((res) => {
      if(res.status === 200)
        resolve();
      else
        return res.text();
    }).then(text => {
      reject(Error(text));  
    }).catch(err => {
      reject(err);
    })
  })
}

// Sign in / Sing out
export const checkAccountExist = (email) => {
  return new Promise((resolve, reject) => {
    fetchFirebaseFunction('emailusedup', {usr: sha256(email)}).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200) 
        resolve(JSON.parse(result[1]));
      else 
        reject(Error(result[1]));
    }).catch(err => {
      reject(err);
    })
  })
}

export const loginWithEmailPwd = (email, password) => {
  return new Promise((resolve, reject) => {
    emailUnderRecover(email).then(result => {
      if(result)
        reject(Error('UnderRecover'));
      else
        return db.ref('/users/'+sha256(email)+'/pwdFailedCounter').once('value');
    }, err => {
      reject(err);
    }).then(snapshot => {
      if(!snapshot || !snapshot.val() || snapshot.val() <= 5)
        return auth.signInWithEmailAndPassword(email, password);
      else
        reject(Error('Permission denied. Wrong password trial limit reached'));
    }).then(() => {
      return recordUserEvent(userActions.PWD_LOGIN_SUCCESS);
    }).then(()=> {
      resolve();
    }).catch(err => {
      if(err.code === 'auth/wrong-password')
        return Promise.all([
          err, recordUserEvent(userActions.PWD_LOGIN_FAILED, email)
        ]);
      else reject(err);
    }).then(result => {
      reject(result[0]);
    }).catch(err => reject(err));
  }) 
}

export const loginWithEmailLink = (email, href) => {
  return new Promise((resolve, reject) => {
    if(firebase.auth().isSignInWithEmailLink(href)) {
      auth.signInWithEmailLink(email, href).then(result => {
        resolve();
      }).catch(err => {
        reject(err);
      })
    } else {
      reject(Error('Permission Denied. Please enter this page by the link in the mail'));
    }
  })
}

export const loginWithPhoneCode = (code, confirmationResult) => {
  return new Promise((resolve, reject) => {
    let credential = firebase.auth.PhoneAuthProvider.credential(confirmationResult.verificationId, code);
    auth.signOut().then(() => {
      auth.signInWithCredential(credential).then(() => {
        resolve()
      }, err => {
        reject(err);
      })
    })
  })
}

export const loginWithOTP = (otp) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'))
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('otpverifier', 
        {usr: tkn, tkn: otp},
        {method: 'POST', mode: 'cors'}
      );
    }).then((res)=> {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        return Promise.all([result[1], auth.signOut()]);
      else throw Error(result[1]);
    }).then(result => {
      return auth.signInWithCustomToken(result[0]);
    }).then(() => {
      resolve();
    }).catch(err => {
      reject(err);
    })
  });
}

export const loginGetChallenge = () => {
  return new Promise((resolve, reject) => {
    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('getchallenge', {usr: tkn});
    }).then((res) => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200)
        resolve(JSON.parse(result[1]));
      else if (result[0] === 204)
        reject();
      else
        reject(Error(result[1]));
    }).catch(err => {
      reject(err);
    })
  })
}

export const loginWithSignature = (tkn, sig) => {
  return new Promise((resolve, reject) => {
    // First sign out usr to make the tkn clean
    auth.signOut().then(() => {
      // Sign in with the tkn
      return auth.signInWithCustomToken(tkn);
    }).then(() => {
      // Use the tkn to fetch login request
      return auth.currentUser.getIdToken(false)
    }).then(newtkn =>{
      // Fetch request with tkn and signed challenge
      return fetchFirebaseFunction('verifychallenge', {usr: newtkn, sig});
    }).then(res => {
      return Promise.all([res.status, res.text()]);
    }).then(result => {
      if(result[0] === 200) // If verification success, sign in with the new token to get full permission
        return Promise.all([result[1], auth.signOut()]);
      else // if not verified, reject the error message
        reject(Error(result[1]));
    }).then(result => {
      return auth.signInWithCustomToken(result[0]);
    }).then(() => {
      resolve();
    }).catch(err => {
      // reject all error
      reject(err);
    })
  })
}

export const logout = (callback) => {
  return auth.signOut().then(()=>{
    if(callback)
      callback();
  })
}

export const reauthCurrentUser = (pwd, otp) => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'))
    loginWithEmailPwd(auth.currentUser.email, pwd).then(() => {
      loginWithOTP(otp).then(() => {
        resolve();
      }, err => {
        reject(err);
      })
    },err => {
      reject(err);
    }).catch(err => {
      reject(err);
    });
  });
}

// Remove
export const removeAccount = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    auth.currentUser.delete().then(() => resolve(), err => resolve(err));
  })
}

// Storage functions
export const uploadUserEvidences = (images) => {
  return new Promise((resolve,reject)=> {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    db.ref('/users/'+sha256(auth.currentUser.email)+'/evidenceUploaded').set(true).then(()=> {
      let userRef = storageRef.child('/userEvidence/'+sha256(auth.currentUser.email));
      return Promise.all(images.map((file, index) => {
        return userRef.child(`/Evidence${index}`).put(file)
      }));
    }).then(() => {
      return recordUserEvent(userActions.EVIDENCE_UPLOADED);
    }).then(()=> {
      resolve();
    }).catch(err => {
      reject(err);
    })
  });
}

export const removeUserStorage = (email) => {
  return new Promise((resolve, reject) => {
    let userRef = storageRef.child('/userEvidence/'+sha256(auth.currentUser.email));
    Promise.all([0,1,2].map(index => {
      return userRef.child(`/Evidence${index}`).delete();
    })).then(() => {
      resolve()
    }).catch(err => {
      resolve(err);
    });
  })
}

//helpers
export const removeAllCurrentAccountData = () => {
  return new Promise((resolve, reject) => {
    if(!auth.currentUser)
      reject(Error('Permission Denied. User not logged in'));
    let mail = auth.currentUser.email;

    auth.currentUser.getIdToken(false).then(tkn => {
      return fetchFirebaseFunction('deleteaccountdb', {usr: tkn});
    }).then(res => {
      if(res.status === 200)
        return Promise.all([
          removeAccount(),
          removeUserStorage(mail)
        ]);
      else return res.text()
    }).then(result => {
      if(Array.isArray(result)){
        if(result[0]) reject(result[0]);
        else resolve();
      } else reject(Error(result));
    }).catch(err => {
      reject(err);
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
  return speakeasy.totp.verify({ 
    secret: key,
    token: otp });
}