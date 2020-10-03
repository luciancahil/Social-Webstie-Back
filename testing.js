//npm install express mysql cors aes256


var aes256 = require('aes256');
const express = require('express');
const cors = require('cors');
const app = express();
const {PORT = 4000} = process.env
const mysql = require('mysql');
const Key = require('./key');
const signUPSalt = require('node-forge');
const signUpPass = require('node-forge');
 
//var key = 'asdfl;sdjlkfjlk;asdlkj';
//var plaintext = 'my plaintext message';
 
//var encrypted = aes256.encrypt(key, plaintext);
//var decrypted = aes256.decrypt(key, encrypted);

app.get('/', (req, res) =>{
    res.end("got to /login for login info")
  })

app.get('/signup', (req, res) =>{
  const{username, password} = req.query;
  let saltGenerator = signUPSalt.md.sha256.create();
  let passHashGenerator = signUpPass.md.sha256.create();
  let saltedPassword;
  let passHash;

  saltGenerator.update(username.substr(username.length/2));

  saltedPassword = password + saltGenerator.digest().toHex();
  console.log(saltedPassword);

  passHashGenerator.update(saltedPassword);

  passHash = passHashGenerator.digest().toHex();
  console.log(passHash);

  res.end("signup page");
})

app.listen(PORT, () => {
  console.log('Server Loaded on port ${PORT}');
})