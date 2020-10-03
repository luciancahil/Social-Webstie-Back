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
const data = require("./Login.json");

 
//var key = 'asdfl;sdjlkfjlk;asdlkj';
//var plaintext = 'my plaintext message';
 
//var encrypted = aes256.encrypt(key, plaintext);
//var decrypted = aes256.decrypt(key, encrypted);

var con = mysql.createConnection({
  host: data.host,
  user: data.user,
  password: data.password,
  database: data.database
});


app.get('/', (req, res) =>{
    res.end("got to /login for login info")
  })

app.get('/signup', (req, res) =>{
  const{username, password} = req.query;
  let saltGenerator = signUPSalt.md.sha256.create();
  let passHashGenerator = signUpPass.md.sha256.create();
  let saltedPassword;
  let passHash;
  let query = "INSERT INTO userlogin VALUES(?, ?)";
  let inserts = [];

  saltGenerator.update(username); //generate a salt from the second half of their username

  saltedPassword = password + saltGenerator.digest().toHex(); //add the salt onto the password.
  console.log(saltedPassword);

  passHashGenerator.update(saltedPassword);

  passHash = passHashGenerator.digest().toHex();        //generate a hash of the salted password

  inserts[0] = username;
  inserts[1] = passHash;

  query = mysql.format(query, inserts);
  console.log(query);

  //var con = "SELECT * FROM ?? WHERE ?? = ?";
//  var inserts = ['users', 'id', "username'; DROP TABLES; --"];
 // con = mysql.format(con, inserts);
  //console.log(con);

  res.end("signup page");

  
})

app.listen(PORT, () => {
  console.log('Server Loaded on port ${PORT}');
})