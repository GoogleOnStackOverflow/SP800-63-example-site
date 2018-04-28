const mfcryptosfwarestring = (hostname, salthex, wrapped_keyhex) => `
const hostname = '${hostname}';
const salt = Buffer.from('${salthex}', 'hex');
const wrapped_key = Buffer.from('${wrapped_keyhex}', 'hex');

const iv = new Buffer.alloc(16);
const crypto = require('crypto');
var eccrypto = require("eccrypto");
const jwtDecode = require('jwt-decode');

const aes256WithPasswordSaltIV = (password, salt, iv, input) => {

  let derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  let cipher = crypto.createCipheriv('AES-256-CTR', derivedKey, iv);
  let encrypted = cipher.update(input);
  return Buffer.concat([encrypted, cipher.final()]);
}

const getChallengeFromJWT = (tkn) => {
  let decodedTkn = jwtDecode(tkn);
  if(decodedTkn.claims.challenge)
    return Buffer.from(decodedTkn.claims.challenge, 'base64')

  return null;
}

const signChallenge = (challenge, privateKey) => {
  return new Promise((resolve, reject) => {
    eccrypto.sign(privateKey, challenge).then((sig) => {
      resolve(sig)
    }).catch(err => {
      reject(err);
    })
  })
}

const getLoginUrl = (tkn, signedChallenge) => {
  return hostname + '?tkn=' + (tkn) + '&sig=' + (signedChallenge);
}

const main = (pwd, tkn) => {
  if(!pwd || !tkn) {
    console.error('USAGE: '+ process.argv[0] + ' ' + process.argv[1] + ' <password> <login token> ');
    return;
  }

  let privateKey = aes256WithPasswordSaltIV(pwd, salt, iv, wrapped_key);
  let challenge = getChallengeFromJWT(tkn);

  if(!challenge) {
    console.error('Bad Tkn Format')
  }

  signChallenge(challenge, privateKey).then(sig => {
    console.log(getLoginUrl(tkn, sig.toString('hex')));  
  });
}

main(process.argv[2], process.argv[3]);`;

const fs = require('fs');
const crypto = require('crypto');
const eccrypto = require("eccrypto");

const iv = new Buffer.alloc(16);

// Wrap/Unwrap private key
const aes256WithPasswordSaltIV = (password, salt, iv, input) => {
  // generate the unwrapping key using pwd and salt by pbkdf2
  let derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  // unwrap the private key
  let cipher = crypto.createCipheriv('AES-256-CTR', derivedKey, iv);
  let encrypted = cipher.update(input);
  return Buffer.concat([encrypted, cipher.final()]);
}

const generateAndReturnKeyPair = () => {
  let pri = crypto.randomBytes(32);
  let pub = eccrypto.getPublic(pri);

  return [pub, pri];
}

const main = (password) => {
  if(!password){
    console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <pwd>`);
    return;
  }

  let hostname = 'http://localhost:3000/admin';
  let salt = crypto.randomBytes(32);
  let keypair = generateAndReturnKeyPair();
  let wrapped_key = aes256WithPasswordSaltIV(password, salt, iv, keypair[1])

  fs.writeFile('authenticator.js', mfcryptosfwarestring(hostname, salt.toString('hex'), wrapped_key.toString('hex')), err => {
    if(err)
      console.error(err);
  })
  
  console.log('authenticator.js generated');
  console.log('\nUser public key:');
  console.log(keypair[0].toString('hex'));
}

main(process.argv[2]);