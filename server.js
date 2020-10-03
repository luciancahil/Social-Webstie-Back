//npm install express mysql cors aes256


var aes256 = require('aes256');
const express = require('express');
const cors = require('cors');
const app = express();
const {PORT = 4000} = process.env
const mysql = require('mysql');
const Key = require('./key');
const salt = require('node-forge');
const pass = require('node-forge');
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
  let saltGenerator = salt.md.sha256.create();
  let passHashGenerator = pass.md.sha256.create();
  let saltedPassword;
  let passHash;
  let querySignUp = "INSERT INTO userlogin VALUES(?, ?)";
  let inserts = [];

  saltGenerator.update(username); //generate a salt from the second half of their username

  saltedPassword = password + saltGenerator.digest().toHex(); //add the salt onto the password.
  //console.log(saltedPassword);

  passHashGenerator.update(saltedPassword);

  passHash = passHashGenerator.digest().toHex();        //generate a hash of the salted password

  inserts[0] = username;
  inserts[1] = passHash;

  querySignUp = mysql.format(querySignUp, inserts);
  //console.log(query);


  con.query(querySignUp, (err, result) => {
    if(err){
      console.log("ERROR!")

      if(err.errno === 1062){
        res.end("duplicate");
      }
      return res.end(err);
    }else{
      
      return res.end("inserted")
    }
  })

  
})

app.get('/login', (req, res) =>{
  const{username, password} = req.query;
  let saltGenerator = salt.md.sha256.create();
  let passHashGenerator = pass.md.sha256.create();
  let saltedPassword;
  let passHash;
  let queryLogin = "SELECT passHash FROM userlogin WHERE username = ?"
  let inserts = [];
  let storedHash;     //password hash in the database

  saltGenerator.update(username); //generate a salt from their username

  saltedPassword = password + saltGenerator.digest().toHex(); //add the salt onto the password.

  passHashGenerator.update(saltedPassword);

  passHash = passHashGenerator.digest().toHex();        //generate a hash of the salted password

  inserts[0] = username;

  queryLogin = mysql.format(queryLogin, inserts);

  con.query(queryLogin, (err, result) => {
    if(err){
      console.log("ERROR!");
      return res.end(err);
    }else{
      
      //the username does not exist
      if(result.length === 0){
        res.end("unfound");
      }else{
        storedHash = result[0].passHash;

        if(passHash === storedHash){  // password is correct
          res.end("granted");
        }else{                  //password is incorrect
          res.end("incorrect");
        }

        return res.end("returned")
      }
    }
  })

  
})

app.listen(PORT, () => {
  console.log('Server Loaded on port ${PORT}');
})