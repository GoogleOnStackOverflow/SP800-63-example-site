const API_PORT = 13428;

// Import the dependend modules
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
var server = require('http').Server(app);
var jwt = require('jsonwebtoken');

app.use(express.static(path.join(__dirname, 'build')));

app.get('/pwdlogin', (req, res) => {
  console.log(`GET LOGIN REQ\tusr=${req.query.usr}, pwd=${req.query.pwd}`);

  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.send(JSON.stringify({tkn: '123123123'}));
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname,'build','index.html'));
});

var expressPort = (process.env.PORT || API_PORT);
server.listen(expressPort, function () {
  console.log(`Device listening on http://localhost:${expressPort}`);
});