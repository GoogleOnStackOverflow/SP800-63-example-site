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

// Firebase Functions
// OTP Verifier
exports.otpverifier = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.tkn)
    res.status(500).send('Bad Request');
  let d = new Date();
  
  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // First check the failed times, which should be less than 5
    db.ref(`/users/${email}/otpFailedCounter`).once('value').then(failedSnapshot => {
      if(!failedSnapshot || !failedSnapshot.val() || failedSnapshot.val() <= 5) {
        // Then check if the otp has been successfully login just now, if yes, block it
        db.ref(`/users/${email}/lastOTPLoginTime`).once('value').then(loginTimeSnapShot => {
          let timer = 60000;
          if(loginTimeSnapShot && loginTimeSnapShot.val()) { 
            let lastLoginTime = new Date(loginTimeSnapShot.val());
            timer = d - lastLoginTime;
          }

          if((timer/1000) > 30) {
            // Get the user credential and verify the OTP
            db.ref(`/users/${email}/otpCredential`).once('value').then((snapshot) => {
              if(snapshot && snapshot.val()){
                if(speakeasy.totp.verify({secret: snapshot.val(), token: JSON.parse(req.query.tkn)})) {
                  d = new Date();
                  db.ref(`/users/${email}/events/${d}`).set({name: 'OTP_LOGIN_SUCCESS'}).then(() => {
                    signTkn(JSON.parse(req.query.usr), {
                      otpVerified: true,
                      dbUsrID: email,
                      logTime: d
                    }).then(tkn => {
                      return res.status(200).send(JSON.stringify(tkn));
                    }).catch(err => {
                      return res.status(500).send(err.message);
                    })
                  });
                } else {
                  d = new Date();
                  db.ref(`/users/${email}/events/${d}`).set({name: 'OTP_LOGIN_FAILED'}).then(()=> {
                    return res.status(400).send('OTP Verification Failed (Invalid OTP)');  
                  });
                }
              } else {
                return res.status(500).send('User not found');
              }
            }).catch(err => {
              return res.status(500).send(err.message);
            })
          } else {
            return res.status(400).send('This OTP is used to login just right now. Please wait at least 30 secs until next trial.');
          }
        })
      } else {
        return res.status(400).send('Failed trial limit reached, your account is temperary disabled')
      }
    })
  }, err => {
    return res.status(500).send(err.message);
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

  verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    db.ref(`/users/${email}/otpCredential`).set(JSON.parse(decodeURIComponent(req.query.credential))).then(() => {
      return res.status(200).send('OK');
    }).catch(err => {
      return res.status(500).send(err.message);
    })
  }, err => {
    return res.status(400).send('User not found');
  })
});

// phone not verified trigger

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
      db.ref(`/users/${context.params.userID}/otpFailedCounter`).set(0).then(() => {
        db.ref(`/users/${context.params.userID}/lastOTPLoginTime`).set(context.params.eventTime)
        .then(()=>resolve()).catch(err => reject(err));
      }).catch(err => reject(err));
    }
  })
})