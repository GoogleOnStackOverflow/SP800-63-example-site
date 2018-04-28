const eccrypto = require('eccrypto');

const verify = (publicKey, challenge, sig) => {
  eccrypto.verify(publicKey, challenge, sig).then(() => {
    console.log('success')
  }).catch((err) => {
    console.error(err);
  });
}

const main = () => {
  let publicKey = Buffer.from(process.argv[2], 'hex');
  let challenge = Buffer.from(process.argv[3], 'base64');
  let signature = Buffer.from(process.argv[4], 'hex');

  verify(publicKey, challenge, signature);
}

main();