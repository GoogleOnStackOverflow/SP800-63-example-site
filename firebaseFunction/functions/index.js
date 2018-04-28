'use strict';

const speakeasy = require('speakeasy');
const sha256 = require('sha256');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const eccrypto = require("eccrypto");

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

const verifyOTPTknAndGetShaEmail = (tkn) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(tkn).then(decodedToken => {
      if(decodedToken.otpVerified)
        resolve(decodedToken.dbUsrID)
      else
        resolve(false);
    }, err => {
      reject(err);
    })
  });
}

const verifyChallengeTknAndGetInfo = (tkn) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(tkn).then(decodedToken => {
      if(decodedToken.challenge) {
        getEmailByUid(decodedToken.uid).then(email => {
          resolve({
            usr: sha256(email),
            chl: decodedToken.challenge
          });
        }, err => {
          reject(err);
        })
      } else {
        resolve(false);
      }
    }, err => {
      reject(err);
    })
  });
}

const verifyTknSingedByPhone = (tkn) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(tkn).then(decodedToken => {
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
            }).then(tkn => {
              // sign success, response the token
              return res.status(200).send(JSON.stringify(tkn));
            }).catch(err => {
              // sign failed
              return res.status(500).send(err.message);
            })
          }).catch(err => {
            // event recording error
            return res.status(500).send(err.message);
          })
        }).catch(err => {
          return res.status(500).send(err.message);
        })
      } else {
        // OTP verification failed
        return res.status(400).send('OTP Verification Failed (Invalid OTP)');  
      }
    }, err => {
      // OTP qualification failed
      return res.status(400).send(err.message);
    })
  }, err => {
    // email/pwd tkn verification failed
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

// get challenge and start a crypto login process if account is admin
exports.getchallenge = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  verifyOTPTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    if(email) {
      // OTP token verified
      db.ref(`/users/${email}/`).once('value').then(snapshot => {
        // check if the user is admin
        if(snapshot.val() && snapshot.val().admin) {
          // check the throttling info
          if(!snapshot.val().adminFailedCounter || snapshot.val().adminFailedCounter <=5){
            // generate a challenge
            crypto.randomBytes(32, (err, buf) => {
              if(err)
                return res.status(500).send(err.message);
              else {
                // save the challenge value in user db
                let challenge = buf.toString('base64');
                db.ref(`/users/${email}/adminNonce`).set(challenge).then(() => {
                  // sign a JWT involing the challenge
                  signTkn(JSON.parse(req.query.usr), {challenge: challenge}).then(tkn => {
                    // send the JWT to the client
                    return res.status(200).send(JSON.stringify(tkn));
                  }, err => {
                    return res.status(500).send(err.message);  
                  })
                }, err => {
                  return res.status(500).send(err.message);
                })
              }
            })
          } else {
            // admin login failed attemp limit reached
            return res.status(204).send(JSON.stringify(false));
          }
        } else {
          // user is not an admin
          return res.status(200).send(JSON.stringify(false));
        }
      })
    } else {
      // Not an OTP verified tkn
      return res.status(400).send('Permission Denied. OTP not verifeid.');
    }
  }, err => {
    // Tkn verification failed
    return res.status(400).send(err.message);
  })
});


// verify a signed challenge of user
exports.verifychallenge = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.sig)
    return res.status(400).send('Bad Request');

  let sig = Buffer.from(JSON.parse(req.query.sig), 'hex');
  // get user sha mail and the challenge
  verifyChallengeTknAndGetInfo(JSON.parse(req.query.usr)).then(info => {
    // if info exists, verify the info
    if(info) {
      // get user data
      db.ref(`/users/${info.usr}`).once('value').then(snapshot => {
        // check if the challenge nonce in the token is valid (as the one in db record)
        if(snapshot.val().admin 
          && snapshot.val().adminNonce 
          && snapshot.val().adminNonce === info.chl
          && (!snapshot.val().adminFailedCounter || snapshot.val().adminFailedCounter <= 5)) {
          let publicKey = Buffer.from(snapshot.val().admin, 'hex');
          let challenge = Buffer.from(info.chl, 'base64');
          
          // verify the signature
          eccrypto.verify(publicKey, challenge, sig).then(() => {
            // verification success, sign a tkn to the user
            signTkn(JSON.parse(req.query.usr), {admin: true}).then(tkn => {
              // clear the used nonce
              db.ref(`/users/${info.usr}/adminNonce`).set(false).then(() => {
                // record the event to trigger throttling events
                let d = new Date();
                db.ref(`/users/${info.usr}/events/${d}`).set({name: 'ADMIN_LOGIN_SUCCESS'}).then(() => {
                  // send the signed admin permission token to client
                  return res.status(200).send(JSON.stringify(tkn));
                }).catch(err => {
                  // Record event failed
                  return res.status(500).send(err.message);  
                })
              }).catch(err => {
                // Clear nonce failed
                return res.status(500).send(err.message);  
              })
            }, err => {
              // Sign token failed
              return res.status(500).send(err.message);
            })
          }).catch((err) => {
            // Signature verification failed. Record this event to trigger the throttling process
            let d = new Date();
            db.ref(`/users/${info.usr}/events/${d}`).set({name: 'ADMIN_LOGIN_FAILED'}).then(() => {
              return res.status(400).send('Permission Denied. Invalid Signature.');
            }).catch(err => {
              return res.status(400).send(err.message);
            })
          });
        } else {
          // challenge in token not match the one in db or the db challenge is used and cleaned
          return res.status(400).send('Permission Denied. Invalid or expired challenge.');
        }
      })
    } else {
      // token verification failed or challenge claims not exists
      return res.status(400).send('Permission Denied. Invalid login token permission.');
    }
  }, err => {
    // token verification failed with internal error
    return res.status(500).send(err.message);
  })
})

exports.emailusedup = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  let usr = JSON.parse(req.query.usr);
  db.ref(`/users/${usr}`).once('value').then(snapshot => {
    let result = snapshot.val()? true : false;
    return res.status(200).send(JSON.stringify(result));
  }).catch(err => {
    return res.status(500).send(err.message);
  })
})

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
    switch(snap.val().name) {
      case 'PWD_LOGIN_FAILED':
        db.ref(`/users/${context.params.userID}/pwdFailedCounter`).once('value').then(snapshot => {
          var nextNum = 1;
          if(snapshot && snapshot.val())
            nextNum = snapshot.val() + 1;
          db.ref(`/users/${context.params.userID}/pwdFailedCounter`).set(nextNum).then(() => {
            resolve();
          }).catch(err => reject(err));
        }).catch(err => reject(err));
        break;

      case 'OTP_LOGIN_FAILED':
        db.ref(`/users/${context.params.userID}/otpFailedCounter`).once('value').then(snapshot => {
          var nextNum = 1;
          if(snapshot && snapshot.val())
            nextNum = snapshot.val() + 1;
          db.ref(`/users/${context.params.userID}/otpFailedCounter`).set(nextNum).then(() => {
            resolve();
          }).catch(err => reject(err));
        }).catch(err => reject(err));
        break;

      case 'ADMIN_LOGIN_FAILED':
        db.ref(`/users/${context.params.userID}/adminFailedCounter`).once('value').then(snapshot => {
          var nextNum = 1;
          if(snapshot && snapshot.val())
            nextNum = snapshot.val() + 1;
          db.ref(`/users/${context.params.userID}/adminFailedCounter`).set(nextNum).then(() => {
            resolve();
          }).catch(err => reject(err));
        }).catch(err => reject(err));
        break;
    
      case 'PWD_LOGIN_SUCCESS':
      case 'PWD_RESET':
        db.ref(`/users/${context.params.userID}/pwdFailedCounter`).set(0)
          .then(() => resolve())
          .catch(err => reject(err));
        break;
    

      case 'OTP_LOGIN_SUCCESS':
      case 'OTP_RESET':
        db.ref(`/users/${context.params.userID}/otpFailedCounter`).set(0).then(() => resolve()).catch(err => reject(err));
        break;
      
      case 'ADMIN_LOGIN_SUCCESS':
        db.ref(`/users/${context.params.userID}/adminFailedCounter`).set(0).then(() => resolve()).catch(err => reject(err));
        break;
      
      default:
        resolve();
        break;
    }
  })
})