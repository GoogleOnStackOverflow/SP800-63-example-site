'use strict';

const speakeasy = require('speakeasy');
const sha256 = require('sha256');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
var db = admin.database();

exports.otpverifier = functions.https.onRequest((req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if(!req.query.usr || !req.query.tkn)
    res.status(500).send('Bad Request');
  var d = new Date();
  var email = decodeURIComponent(req.query.usr);
  db.ref('/users/'+sha256(email)+'/otpCredential').once('value').then((snapshot) => {
    if(snapshot && snapshot.val()){
      if(speakeasy.totp.verify({ secret: snapshot.val(), token: req.query.tkn })) {
        d = new Date();
        db.ref('/users/'+sha256(email)+'/events/'+d).set({name: 'OTP_LOGIN_SUCCESS'}).then(() => {
          res.status(200).send('OK');  
        });
      } else {
        d = new Date();
        db.ref('/users/'+sha256(email)+'/events/'+d).set({name: 'OTP_LOGIN_FAILED'}).then(()=> {
          res.status(400).send('Failed');  
        });
      }
    } else {
      res.status(500).send('User not found');
    }
  }).catch(err => {
    res.status(500).send(err.message);
  })
});

exports.touch