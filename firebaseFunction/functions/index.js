'use strict';

const speakeasy = require('speakeasy');
const sha256 = require('sha256');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./sp800-63-example-site-firebase-adminsdk-cfib4-633852dd75.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sp800-63-example-site.firebaseio.com"
});

var db = admin.database();

// helper
// sign a otp_tkn
const signTkn = (originalTkn, additionalClaims) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(originalTkn).then(decodedToken => {
      admin.auth().createCustomToken(decodedToken.uid, additionalClaims)
      .then(tkn => resolve(tkn))
      .catch(err => reject(err))
    }).catch(err => reject(err));
  }) 
}

// getEmailByUid
const getEmailByUid = (uid) => {
  return new Promise((resolve, reject) => {
    admin.auth().getUser(uid).then(userRecord => {
      if(userRecord && userRecord.email)
        resolve(userRecord.email)
      else
        reject(Error('User not found'));
    }).catch(err => {
      reject(err);
    })
  })
}

// verify an id_tkn
const verifyTknAndGetShaEmail = (tkn) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(tkn).then(decodedToken => {
      getEmailByUid(decodedToken.uid).then(email => {
        resolve(sha256(email));
      }, err => {
        reject(err);
      })
    }, err => {
      reject(err);
    })
  });
}

const verifyTknAndCheckPermission = (tkn) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(tkn).then(decodedToken => {
      // TODO check the content of each permission
      console.log(decodedToken.firebase.sign_in_provider);
      if(decodedToken.firebase.sign_in_provider === 'phone')
        resolve(true);
      else resolve(false);
    }, err => {
      reject(err);
    })
  });
}

const checkOTPQualificationThenCredential = (usr, otp) => {
  return new Promise((resolve, reject) => {
    db.ref(`/users/${usr}`).once('value').then(snapshot => {
      if(!snapshot || !snapshot.val())
        reject(Error('User not found.'));
      if(snapshot.val().otpFailedCounter && snapshot.val.otpFailedCounter >5)
        reject(Error('OTP Wrong trial limit reached. Please reset your account to resolve this'));
      let d = new Date();

      if(snapshot.val().lastOTP){
        if(snapshot.val().lastOTP === otp)
          reject(Error('The OTP is used just right now. Please wait for the next one'));
      }
      resolve(snapshot.val().otpCredential)
    }).catch(err => {
      reject(err);
    })
  })
}

// Firebase Functions
// OTP Verifier
exports.otpverifier = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.tkn)
    res.status(500).send('Bad Request');
  
  let otp = JSON.parse(req.query.tkn)
  // verify email/pwd tkn
  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {

    // check not using the same otp and get the credential
    checkOTPQualificationThenCredential(email, otp).then(credential => {
      // verify the otp
      if(speakeasy.totp.verify({secret: Buffer.from(credential, 'ascii'), token: otp})) {
        // if otp verification successed, record the event
        let d = new Date();
        db.ref(`/users/${email}/events/${d}`).set({name: 'OTP_LOGIN_SUCCESS'}).then(() => {
          db.ref(`/users/${email}/lastOTP`).set(otp).then(() => {
            // sign the otp token to the user
            signTkn(JSON.parse(req.query.usr), {
              otpVerified: true,
              dbUsrID: email,

              // sign success, response the token
            }).then(tkn => {
              return res.status(200).send(JSON.stringify(tkn));

              // sign failed
            }).catch(err => {
              return res.status(500).send(err.message);
            })

          // event recording error
          }).catch(err => {
            return res.status(500).send(err.message);
          })
        }).catch(err => {
          return res.status(500).send(err.message);
        })

      // OTP verification failed
      } else {
        return res.status(400).send('OTP Verification Failed (Invalid OTP)');  
      }

    // OTP qualification failed
    }, err => {
      return res.status(400).send(err.message);
    })

  // email/pwd tkn verification failed
  }, err => {
    return res.status(400).send(err.message);
  })
});

exports.otpdeliverd = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}`).once('value').then(snapshot => {
      if(snapshot && snapshot.val() && snapshot.val().otpCredential)
        res.status(200).send(JSON.stringify(true));
      else res.status(200).send(JSON.stringify(false));
    }).catch(err => {
      res.status(500).send(err.message);
    });
  }, err => {
    return res.status(400).send(err.message);
  })
});

// set user pii
// usr = sha256(email)
// pii = obj
exports.setuserpii = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(usr => {
    db.ref(`/users/${usr}`).once('value').then(snapshot => {
      if(snapshot && snapshot.val() && snapshot.val().pii)
        return res.status(400).send('Permission Denied. User PII exists');
      
      let piiContent = JSON.parse(req.query.pii);
    
      Promise.all(Object.keys(piiContent).map(key => {
        return db.ref(`/users/${usr}/pii/${key}`).set(piiContent[key]);
      })).then(() => {
        db.ref(`/users/${usr}/piiVerified`).set(false).then(() => {
          return res.status(200).send('OK');
        }).catch(err => {
          return res.status(500).send(err.message);
        })
      }).catch(err => {
        return res.status(500).send(err.message);
      })
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }, err => {
    return res.status(500).send(err.message);
  });
});

// check if user pii set
exports.userpiiset = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}`).once('value').then(snapshot => {
      if(snapshot && snapshot.val() && snapshot.val().pii)
        res.status(200).send(JSON.stringify(true));
      else res.status(200).send(JSON.stringify(false));
    }).catch(err => {
      res.status(500).send(err.message);
    });
  }, err => {
    return res.status(500).send(err.message);
  });
});

// check if user pii verified
exports.userpiiverified = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}`).once('value').then(snapshot => {
      if(snapshot.val().piiVerified)
        return res.status(200).send(JSON.stringify(true));
      else
        return res.status(200).send(JSON.stringify(false));
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }, err => {
    return res.status(500).send(err.message);
  });
});

// check if user phone verified
exports.userphoneverified = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}`).once('value').then(snapshot => {
      if(snapshot.val().userPhoneVerified)
        return res.status(200).send(JSON.stringify(true));
      else
        return res.status(200).send(JSON.stringify(false));
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }, err => {
    return res.status(500).send(err.message);
  });
});

// check if user evidence uploaded
exports.userevidenceuploaded = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}`).once('value').then(snapshot => {
      if(snapshot.val().evidenceUploaded)
        return res.status(200).send(JSON.stringify(true));
      else
        return res.status(200).send(JSON.stringify(false));
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }, err => {
    return res.status(500).send(err.message);
  });
});

// check if phone used
exports.phoneusedup = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.phone)
    return res.status(400).send('Bad Request');

  let phone = JSON.parse(req.query.phone);
  db.ref('/users/').once('value').then(snapshot => {
    let userid = Object.keys(snapshot.val());
    for(let i=0; i<userid.length; i++){
      if(snapshot.val()[userid[i]] 
        && snapshot.val()[userid[i]].userPhoneVerified
        && snapshot.val()[userid[i]].pii
        && snapshot.val()[userid[i]].pii.Phone === phone)
        return res.status(200).send(JSON.parse(true));
    }

    return res.status(200).send(JSON.parse(false));
  }).catch(err => {
    return res.status(500).send(err.message);
  })
});

// check if email used
exports.emailusedup = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.email)
    return res.status(400).send('Bad Request');

  let email = sha256(JSON.parse(req.query.email));
  db.ref('/users/').once('value').then(snapshot => {
    if(Object.keys(snapshot.val()).includes(email))
      return res.status(200).send(JSON.parse(true));
    else
      return res.status(200).send(JSON.parse(true));
  }).catch(err => {
    return res.status(500).send(err.message);
  })
});

// get user pii

// get user phone
exports.getusrphone = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}`).once('value').then(snapshot => {
      if(snapshot.val().pii && snapshot.val().pii.Phone)
        return res.status(200).send(JSON.stringify(snapshot.val().pii.Phone));
      else
        return res.status(400).send('Phone not set yet');
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }, err => {
    return res.status(500).send(err.message);
  });
});

// set user otp credential
exports.setotpcredential = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.credential)
    return res.status(400).send('Bad Request');

  // First check the permission
  // Recovering account should login by phone provider before this action
  // For a new account the otp credential should be null in the database
  // For full permission accounts, the otp credential could be set directly from the client
  verifyTknAndCheckPermission(JSON.parse(req.query.usr)).then(result => {
    verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
      db.ref(`/users/${email}`).once('value').then(snapshot => {
        // if it's a reset account request
        if((result && snapshot.val() && snapshot.val().underRecover)
          // or it's a set new account credential request
          || (!result && snapshot.val() && !snapshot.val().otpCredential)) {
          db.ref(`/users/${email}/otpCredential`).set(JSON.parse(decodeURIComponent(req.query.credential))).then(() => {
            return res.status(200).send('OK');
          }).catch(err => {
            return res.status(500).send(err.message);
          })
        } else {
          // Permission denied
          return res.status(400).send('Permission Denied (OTP credential set). Please reauthenticate your account using your last OTP credential or start an account recovery process.');
        }
      }).catch(err => {
        // Internal error
        return res.status(500).send(err.message);
      })
    }, err => {
      // Cannot get a mail from the tkn
      return res.status(400).send('User not found');
    })
  }, err => {
    // Cannot verify the tkn
    return res.status(400).send('Permission Denied (Invalid JWT). Please login first before this action.');
  })
});

// start recovery process
exports.markrecoverflag = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  let usr = JSON.parse(req.query.usr);
  console.log(`Got mark request of usr = ${usr}`);
  if(!req.query.id && !req.query.birthday) {
    // set the flag false
    db.ref(`/users/${usr}/underRecover`).set(false).then(() => {
      return res.status(200).send('OK');
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  } else if(!req.query.id || !req.query.birthday) {
    return res.status(400).send('Bad Request');
  } else {
    // verify the pii and set the flag true
    db.ref(`/users/${usr}`).once('value').then(snapshot => {
      if(!snapshot.val())
        return res.status(400).send('Account not exists');
      if(!snapshot.val().piiVerified)
        return res.status(400).send('User has not finished the register process yet')
      else {
        let recordPii = snapshot.val().pii;
        if(JSON.parse(req.query.id) === recordPii.ID 
          && JSON.parse(req.query.birthday) === recordPii.Birthday){
          db.ref(`/users/${usr}/underRecover`).set(true).then(() => {
            return res.status(200).send('OK');
          }).catch(err => {
            return res.status(500).send(err.message);
          })
        } else {
          return res.status(400).send('Permission Denied. The personal information verification failed');
        }
      }
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }
})

// Throttling trigger
exports.manageThrottling = functions.database.ref('/users/{userID}/events/{eventTime}').onCreate((snap, context) => {
  return new Promise((resolve, reject) => {
    if(snap.val().name === 'PWD_LOGIN_FAILED'){
      db.ref(`/users/${context.params.userID}/pwdFailedCounter`).once('value').then(snapshot => {
        var nextNum = 1;
        if(snapshot && snapshot.val())
          nextNum = snapshot.val() + 1;
        db.ref(`/users/${context.params.userID}/pwdFailedCounter`).set(nextNum).then(() => {
          resolve();
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    }

    if(snap.val().name === 'OTP_LOGIN_FAILED'){
      db.ref(`/users/${context.params.userID}/otpFailedCounter`).once('value').then(snapshot => {
        var nextNum = 1;
        if(snapshot && snapshot.val())
          nextNum = snapshot.val() + 1;
        db.ref(`/users/${context.params.userID}/otpFailedCounter`).set(nextNum).then(() => {
          resolve();
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    }
    
    if(snap.val().name === 'PWD_LOGIN_SUCCESS'){
      db.ref(`/users/${context.params.userID}/pwdFailedCounter`).set(0)
        .then(() => resolve())
        .catch(err => reject(err));
    }

    if(snap.val().name === 'OTP_LOGIN_SUCCESS'){
      db.ref(`/users/${context.params.userID}/otpFailedCounter`).set(0).then(() => resolve()).catch(err => reject(err));
    }
  })
})