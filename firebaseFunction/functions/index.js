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
var storage = admin.storage();

// helper
// sign a otp_tkn
const signTkn = (originalTkn, additionalClaims) => {
  return new Promise((resolve, reject) => {
    admin.auth().verifyIdToken(originalTkn).then(decodedToken => {
      return admin.auth().createCustomToken(decodedToken.uid, additionalClaims);
    }).then(tkn => resolve(tkn))
    .catch(err => reject(err));
  }) 
}

// getEmailByUid
const getEmailByUid = (uid) => {
  return admin.auth().getUser(uid).then(userRecord => {
    if(userRecord && userRecord.email)
      return userRecord.email;
    else
      throw(Error('User not found'));
  });
}

// verify an id_tkn
const verifyTknAndGetShaEmail = (tkn) => {
  return admin.auth().verifyIdToken(tkn).then(decodedToken => {
    return getEmailByUid(decodedToken.uid);
  }).then(email => {
    return sha256(email);
  });
}

const verifyOTPTknAndGetShaEmail = (tkn) => {
  return admin.auth().verifyIdToken(tkn).then(decodedToken => {
    if(decodedToken.otpVerified)
      return decodedToken.dbUsrID;
    else
      return false;
  });
}

const verifyChallengeTknAndGetInfo = (tkn) => {
  return admin.auth().verifyIdToken(tkn).then(decodedToken => {
    if(decodedToken.challenge) {
      return Promise.all([
        decodedToken.challenge,
        getEmailByUid(decodedToken.uid)
      ]);
    } else {
      return false;
    }
  }).then(results => {
    if(results) 
      return {
        usr: sha256(results[1]),
        chl: results[0]
      };
    else return email;
  })
}

const verifyTknSingedByPhone = (tkn) => {
  return admin.auth().verifyIdToken(tkn).then(decodedToken => {
    return decodedToken.firebase.sign_in_provider === 'phone';
  });
}

const checkOTPQualificationThenCredential = (usr, otp) => {
  return db.ref(`/users/${usr}`).once('value').then(snapshot => {
    if(!snapshot || !snapshot.val())
      throw Error('User not found.');

    if(snapshot.val().otpFailedCounter && snapshot.val().otpFailedCounter >5) {
      throw Error('OTP Wrong trial limit reached. Please reset your account to resolve this');
    }

    if(snapshot.val().lastOTP && snapshot.val().lastOTP === otp)
      throw Error('The OTP is used just right now. Please wait for the next one');

    return snapshot.val().otpCredential;
  });
}

// Firebase Functions
// OTP Verifier
exports.otpverifier = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.tkn)
    return res.status(500).send('Bad Request');
  
  let otp = JSON.parse(req.query.tkn);

  // verify email/pwd tkn
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // check not using the same otp and get the credential
    return Promise.all([email, checkOTPQualificationThenCredential(email, otp)]);
  }).then(results => {
    let email = results[0];
    let credential = results[1];

    // verify the otp
    if(speakeasy.totp.verify({secret: Buffer.from(credential, 'ascii'), token: otp})) {
      // if otp verification successed, record the event
      let d = new Date();
      return Promise.all([email,
        db.ref(`/users/${email}/events/${d}`).set({name: 'OTP_LOGIN_SUCCESS'})
      ]);
    } else {
      // OTP verification failed
      let err = new Object();
      err.email = email;
      throw err;
    }
  }).then(results => {
    // event recorded, record the passed OTP
    return Promise.all([results[0],
      db.ref(`/users/${results[0]}/lastOTP`).set(otp)
    ]);
  }).then(results => {
    // Last OTP recorded, sign the OTP token
    return signTkn(JSON.parse(req.query.usr), {otpVerified: true, dbUsrID: results[0]});
  }).then(tkn => {
    // sign success, response the token
    return res.status(200).send(JSON.stringify(tkn));
  }).catch(err => {
    // error thown, catch and response
    if(err.email) {
      let d = new Date();
      return db.ref(`/users/${err.email}/events/${d}`).set({name: 'OTP_LOGIN_FAILED'})
    } else
      return res.status(500).send(err.message);
  }).then(() => {
    return res.status(400).send('OTP Verification Failed (Invalid OTP)');
  }).catch(err => {
    return res.status(500).send(err.message);
  });
});

exports.otpdeliverd = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  // Verify token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // Get the credential set status
    return db.ref(`/users/${email}`).once('value');
  }).then(snapshot => {
    // If credential is set
    if(snapshot && snapshot.val() && snapshot.val().otpCredential) 
      return res.status(200).send(JSON.stringify(true));
    else
      return res.status(200).send(JSON.stringify(false));
  }).catch(err => {
    // Verification Failed
    return res.status(400).send(err.message);
  });
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

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(usr => {
    // Get the snapshot of the user to check if it's the first time setting
    return Promise.all([usr, db.ref(`/users/${usr}`).once('value')]);
  }).then(results => {
    let usr = results[0];
    let snapshot = results[1];

    // if its not the first time setting, throw
    if(snapshot && snapshot.val() && snapshot.val().pii)
      throw Error('EXISTS');

    // if its the first time setting, set the data
    let piiContent = JSON.parse(req.query.pii);
    return Promise.all(Object.keys(piiContent).map(key => {
      return db.ref(`/users/${usr}/pii/${key}`).set(piiContent[key]);
    }));
  }).then(() => {
    // data set
    return res.status(200).send('OK');
  }).catch(err => {
    // error occurs
    if(err.message === 'EXISTS')
      return res.status(400).send('Permission Denied. Personal data exists');
    else
      return res.status(500).send(err.message);
  })
});

// check if user pii set
exports.userpiiset = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // Get the data
    return db.ref(`/users/${email}`).once('value');
  }).then(snapshot => {
    // response the result
    if(snapshot && snapshot.val() && snapshot.val().pii)
      return res.status(200).send(JSON.stringify(true));
    else
      return res.status(200).send(JSON.stringify(false));
  }).catch(err => {
    // error occurs
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

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // Get the data
    return db.ref(`/users/${email}`).once('value');
  }).then(snapshot => {
    // response the result
    if(snapshot.val().piiVerified)
      return res.status(200).send(JSON.stringify(true));
    else
      return res.status(200).send(JSON.stringify(false));
  }).catch(err => {
    // error occurs
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

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // Get the data
    return db.ref(`/users/${email}`).once('value')
  }).then(snapshot => {
    // response the result
    if(snapshot.val().userPhoneVerified)
      return res.status(200).send(JSON.stringify(true));
    else
      return res.status(200).send(JSON.stringify(false));
  }).catch(err => {
    // error occurs
    return res.status(500).send(err.message);
  })
});

// check if user evidence uploaded
exports.userevidenceuploaded = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // Get the data
    return db.ref(`/users/${email}`).once('value');
  }).then(snapshot => {
    // response the result
    if(snapshot.val().evidenceUploaded)
      return res.status(200).send(JSON.stringify(true));
    else
      return res.status(200).send(JSON.stringify(false));
  }).catch(err => {
    // error occurs
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

  // Verify if the token has OTP permission
  return verifyOTPTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // OTP verified
    if(email)
      // Get the data
      return Promise.all([email,
        db.ref(`/users/${email}/`).once('value')
      ]);
    // OTP Not verified
    else
      throw Error('Permission Denied. OTP not verifeid.');
  }).then(results => {
    let snapshot = results[1];
    // check if the account is an admin
    if(snapshot.val() && snapshot.val().admin) {
      // check the throttling info
      if(!snapshot.val().adminFailedCounter || snapshot.val().adminFailedCounter <=5)
        return Promise.all([results[0], crypto.randomBytes(32)]);
      else 
        throw Error('THROTTLED');
    } else 
      throw Error('NOT_ADMIN');
  }).then(results => {
    // Got a nonce, record it in user db
    return Promise.all([results[1].toString('base64'),
      db.ref(`/users/${results[0]}/adminNonce`).set(results[1].toString('base64'))
    ]);
  }).then((results) => {
    // Sign the token
    return signTkn(JSON.parse(req.query.usr), {challenge: results[0]});
  }).then(tkn => {
    // Send the signed token back to the client
    return res.status(200).send(JSON.stringify(tkn));
  }).catch(err => {
    if(err.message === 'THROTTLED')
      return res.status(204).send(JSON.stringify(false));
    else if(err.message === 'NOT_ADMIN')
      return res.status(200).send(JSON.stringify(false));
    else
      return res.status(500).send(err.message);
  });
});


// verify a signed challenge of user
exports.verifychallenge = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.sig)
    return res.status(400).send('Bad Request');

  let sig = Buffer.from(JSON.parse(req.query.sig), 'hex');

  // Define the error to catch it right
  let verifySig = (publicKey, challenge, sig) => {
    return eccrypto.verify(publicKey, challenge, sig).then(() => {
      return;
    }).catch(() => {
      throw Error('FAILED');
    });
  }

  // get user sha mail and the challenge
  return verifyChallengeTknAndGetInfo(JSON.parse(req.query.usr)).then(info => {
    // if info exists, verify the info
    if(info) {
      return Promise.all([info, db.ref(`/users/${info.usr}`).once('value')]);
    } else 
      throw Error('NO_CHALLENGE');
  }).then(results => {
    let info = results[0];
    let snapshot = results[1];

    // If the account is not for an admin user
    if(!snapshot.val().admin)
      throw Error('NOT_ADMIN');

    // If the nonce not matches 
    if(snapshot.val().adminNonce !== info.chl)
      throw Error('INVALID_CHALLENGE');

    // If the error rate limit is reached
    if(snapshot.val().adminFailedCounter && snapshot.val().adminFailedCounter <= 5)
      throw Error('THROTTLED');
    
    let publicKey = Buffer.from(snapshot.val().admin, 'hex');
    let challenge = Buffer.from(info.chl, 'base64');
    
    // verify the signature
    return Promise.all([
      info,
      verifySig(publicKey, challenge, sig)
    ]);
  }).then(results => {
    // Signature Verified, sign a token for the user
    return Promise.all([
      results[0], // info
      signTkn(JSON.parse(req.query.usr), {admin: true})
    ]);
  }).then(results => {
    let info = results[0];
    let tkn = results[1];
    let d = new Date();

    // Record the success login event and clear the used nonce
    return Promise.all([
      tkn,
      db.ref(`/users/${info.usr}/adminNonce`).set(false),
      db.ref(`/users/${info.usr}/events/${d}`).set({name: 'ADMIN_LOGIN_SUCCESS'})
    ]);
    // clear the used nonce
  }).then(results => {
    // send the signed admin permission token to client
    return res.status(200).send(JSON.stringify(results[0] /* tkn */));
  }).catch(err => {
    // Verification Failed, record the result
    if(err.message === 'FAILED') {
      let d = new Date();
      return db.ref(`/users/${info.usr}/events/${d}`).set({name: 'ADMIN_LOGIN_FAILED'});

    // Other permission issues
    } else if(err.message === 'NO_CHALLENGE')
      return res.status(400).send('Permission Denied. Invalid Token.');
    else if(err.message === 'NOT_ADMIN')
      return res.status(400).send('Permission Denied. The account is not for an admin user.');
    else if(err.message === 'INVALID_CHALLENGE')
      return res.status(400).send('Permission Denied. Invalid or expired challenge.');
    else if(err.message === 'THROTTLED')
      return res.status(400).send('Permission Denied. Error rate limit reached.');
    // Other internal errors
    else
      throw err;
  }).then(() => {
    // Verification Failed result recorded, send the result to the user
    return res.status(400).send('Permission Denied. Invalid Signature.');
  }).catch(err => {
    // Other internal error occurs
    return res.status(500).send(err.message);
  });
})

exports.emailusedup = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  let usr = JSON.parse(req.query.usr);

  // Get the data
  return db.ref(`/users/${usr}`).once('value').then(snapshot => {
    // If the email is used, response true, otherwise response false
    let result = snapshot.val()? true : false;
    return res.status(200).send(JSON.stringify(result));
  }).catch(err => {
    // Internal error occurs
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

  // Get all the data
  return db.ref('/users/').once('value').then(snapshot => {
    // Find if the phone number used
    // If yes, response true
    let userid = Object.keys(snapshot.val());
    for(let i=0; i<userid.length; i++){
      if(snapshot.val()[userid[i]] 
        && snapshot.val()[userid[i]].userPhoneVerified
        && snapshot.val()[userid[i]].pii
        && snapshot.val()[userid[i]].pii.Phone === phone)
        return res.status(200).send(JSON.parse(true));
    }

    // Not found, response false
    return res.status(200).send(JSON.parse(false));
  }).catch(err => {
    // Internal error occurs
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

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    // Get the data
    return db.ref(`/users/${email}`).once('value');
  }).then(snapshot => {
    // Get the phone num of the user and send it back
    if(snapshot.val().pii && snapshot.val().pii.Phone)
      return res.status(200).send(JSON.stringify(snapshot.val().pii.Phone));
    else
      return res.status(400).send('Phone not set yet');
  }).catch(err => {
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
  return Promise.all([
    verifyTknSingedByPhone(JSON.parse(req.query.usr)),
    verifyTknAndGetShaEmail(JSON.parse(req.query.usr))
  ]).then(results => {
    return Promise.all([
      results[0], results[1], // inheritance
      db.ref(`/users/${results[1]}`).once('value')
    ])
  }).then(results => {
    let verifiedByPhone = results[0];
    let email = results[1];
    let snapshot = results[2];

    if(!snapshot.val())
      throw Error('User not found. Please contact the administrator to fix this');
    
    // A legal rebinding request
    if((verifiedByPhone && snapshot.val().underRecover)
    // A legal first binding request
      || (!verifiedByPhone && !snapshot.val().otpCredential)){
      return Promise.all([
        email,
        db.ref(`/users/${email}/otpCredential`).set(JSON.parse(decodeURIComponent(req.query.credential)))
      ]);
    } else
      throw Error('BAD_PERMISSION');
  }).then(results => {
    let email = results[0];
    let d = new Date();
    return db.ref(`/users/${email}/events/${d}`).set({name: 'OTP_RESET'});
  }).then(() => {
    // bound, response ok to the client
    return res.status(200).send('OK');
  }).catch(err => {
    // Bad permission situation
    if(err.message === 'BAD_PERMISSION')
      return res.status(400).send('Permission Denied (OTP credential set). Please reauthenticate your account using your last OTP credential or start an account recovery process.')
    // internal error occurs
    else
      return res.status(500).send(err.message);
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

  // To set the recovery flag to false, send an empty query
  if(!req.query.id && !req.query.birthday) {
    // set the flag false
    return db.ref(`/users/${usr}/underRecover`).set(false)
    .then(() => {
      return res.status(200).send('OK');
    }).catch(err => {
      return res.status(500).send(err.message);
    });
  } else if(!req.query.id || !req.query.birthday) {
    return res.status(400).send('Bad Request');
  } else {
    // verify the pii and set the flag true
    return db.ref(`/users/${usr}`).once('value').then(snapshot => {
      if(!snapshot.val())
        throw Error('NOT_EXISTS');     
      if(!snapshot.val().piiVerified)
        throw Error('NOT_FINISHED');
      else 
        return snapshot.val().pii;
    }).then(recordPii => {
      return (JSON.parse(req.query.id) === recordPii.ID
        && JSON.parse(req.query.birthday) === recordPii.Birthday);
    }).then(result => {
      if(result)
        return db.ref(`/users/${usr}/underRecover`).set(true)
      else throw Error('FAILED');
    }).then(() => {
      return res.status(200).send('OK');
    }).catch(err => {
      if(err.message === 'NOT_EXISTS')
        return res.status(400).send('Account not exists');
      else if(err.message === 'NOT_FINISHED') {
        return res.status(403).send('User has not finished the register process yet')
      } else if(err.message === 'FAILED')
        return res.status(400).send('Permission Denied. The personal information verification failed');
      else
        return res.status(500).send(err.message);
    });
  }
})

exports.deleteaccountdb = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr)
    return res.status(400).send('Bad Request');

  // Verify the token
  return verifyTknAndGetShaEmail(JSON.parse(req.query.usr)).then(email => {
    console.log(`Get delete account request for ${email}`);
    // delete the data
    return db.ref(`/users/${email}`).set({});
  }).then(() => {
    // response ok to the client
    return res.status(200).send('OK');
  }).catch(err => {
    // internal error
    return res.status(500).send(err.message);
  })
})

// Throttling trigger
exports.manageThrottling = functions.database.ref('/users/{userID}/events/{eventTime}').onCreate((snap, context) => {
  const EventTargetMap = {
    'PWD_LOGIN_FAILED': {
      'target':'pwdFailedCounter',
      'failed': true
    }, 
    'PWD_LOGIN_SUCCESS': {'target': 'pwdFailedCounter'},
    'PWD_RESET': {'target': 'pwdFailedCounter'},
    
    'OTP_LOGIN_FAILED': {
      'target':'otpFailedCounter',
      'failed': true
    }, 
    'OTP_LOGIN_SUCCESS': {'target': 'otpFailedCounter'}, 
    'OTP_RESET': {'target': 'otpFailedCounter'},

    'ADMIN_LOGIN_FAILED': {
      'target':'adminFailedCounter',
      'failed': true
    }, 
    'ADMIN_LOGIN_SUCCESS': {'target': 'adminFailedCounter'}, 
  };

  let target = EventTargetMap[snap.val().name];
  if(target && target['failed']) {
    return db.ref(`/users/${context.params.userID}/${target['target']}`).once('value')
    .then(snapshot => {
      return snapshot.val()? snapshot.val() + 1 : 1;
    }).then(nextNum => {
      return db.ref(`/users/${context.params.userID}/${target['target']}`).set(nextNum);
    });
  } else if(target) {
    return db.ref(`/users/${context.params.userID}/${target['target']}`).set(0);
  } else return 0;
})