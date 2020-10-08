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

app.use(cors());
 
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
  let saltGenerator = salt.md.sha256.create();                  // The forge that will generate the salt
  let passHashGenerator = pass.md.sha256.create();              // The forge that will generate the hash from the password
  let saltedPassword;                                           // The password with the salt appended 
  let passHash;                                                 // The salted hash of the password
  let querySignUp = "INSERT INTO userlogin VALUES(?, ?, ?)";    // The query for the signup, with values username, passhash, and usernum
  let inserts = [];
  let userNum;                                                  // generates a number by treating each character like a base

  saltGenerator.update(username); //generate a salt from the second half of their username

  saltedPassword = password + saltGenerator.digest().toHex(); //add the salt onto the password.
  
  userNum = parseInt(saltGenerator.digest().toHex(), 16) % 1000000000;  // generates the userNum from the hash of the username


  passHashGenerator.update(saltedPassword);

  passHash = passHashGenerator.digest().toHex();        //generate a hash of the salted password

  inserts[0] = username;
  inserts[1] = passHash;
  inserts[2] = userNum;

  querySignUp = mysql.format(querySignUp, inserts);


  con.query(querySignUp, (err, result) => {
    if(err){
      console.log("ERROR!")
      console.log(err);

      if(err.errno === 1062){
        res.end("duplicate");
      }
      return res.end(err);
    }else{
      
      return res.end("inserted")
    }
  })

  
})


//cleans up the query string to get 
function cleanQuery(string){
  let purged = replaceAll(string, "+", " ");
  purged = replaceAll(purged, "%20", " ");
  purged = replaceAll(purged, "%26", "&");
  purged = replaceAll(purged, "%22", "\"");
  purged = replaceAll(purged, "%3E", ">");
  purged = replaceAll(purged, "%3C", "<");
  purged = replaceAll(purged, "%22", "\"");
  purged = replaceAll(purged, "%27", "'");
  purged = replaceAll(purged, "%lf", "%");
  

  return purged;
}

//replace all implementation
function replaceAll(string, oldChar, newChar){
  let replaced = string.replace(oldChar, newChar);

  while(replaced != replaced.replace(oldChar, newChar)){
    replaced = replaced.replace(oldChar, newChar)
  }

  return replaced;
}

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
      console.log(queryLogin);
      console.log(err);
      return res.end("err");
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


app.get('/addQnA',(req, res) =>{
  const{username, password, question, answer} = req.query;
  cleanQuestion = cleanQuery(question);
  cleanAnswer = cleanQuery(answer);
  let addKey = Key.getKey(username, password);
  let encryptedAnswer = aes256.decrypt(addKey, cleanAnswer);


  console.log(encryptedAnswer);

  res.end('working');
})

app.listen(PORT, () => {
  console.log('Server Loaded on port ${PORT}');
})