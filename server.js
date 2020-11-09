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


/*
* Purpose: clean a query by removing query special characters with their actual 
*   inteneded characters
*
* Paramater: string - the query string to be cleaned
*
* Return: A string with all the query selections replaced
*/
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

/*
* Purpose: replace all instances of oldSubString with newSubString
*
* Paramater: string - the query string to be modified
* Parameter: oldSubString - the substring we are going to replace
* Parameter: newSubString - the substring we are replacing each 
*     intance of oldSubString with
* Return: A string with all the query selections replaced
*/
function replaceAll(string, oldSubString, newSubString){
  let replaced = string.replace(oldSubString, newSubString);  // string that has oldSubString replaced

  // replace each instance of oldSubString until there are none left
  while(replaced != replaced.replace(oldSubString, newSubString)){
    replaced = replaced.replace(oldSubString, newSubString)
  }

  return replaced;
}

app.get('/', (req, res) =>{
    res.end("got to /login for login info")
})



/*
* Purpose: Add a new user into the userlogin table with their username and salted hashed password
*
* Paramater: username - the requested username
* Parameter: password - the requested password
*  
* Return: duplicate if the "username" already exists, "inserted" otherwise
*/
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



/*
* Purpose: Add a new user into the userlogin table with their username and salted hashed password
*
* Paramater: username - the users username
* Parameter: password - the users password
*  
* Return: "unfound" if the username doesn't exist, "incorrect" if the password is incorrect, "granted" otherwise
*/
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

/*
* Purpose: Add a new user's QNA entry into the userlogin table with their username, question, and encryped answer
*
* Paramater: username - the users username
* Parameter: password - the users password
* Parameter: question - the question the user is answering
* Parameter: answer - the answer given
*  
* Return: "ERROR!" if an error occured, "inserted" otherwise
*/
app.get('/addQnA',(req, res) =>{
  const{username, password, question, answer} = req.query;
  cleanQuestion = cleanQuery(question);
  cleanAnswer = cleanQuery(answer);
  let addKey = Key.getKey(username, password);
  let encryptedAnswer = aes256.encrypt(addKey, cleanAnswer);
  let addQnAQuery = "Insert INTO userinfo VALUES(?,?,?) ON DUPLICATE KEY UPDATE encryptedAnswer = ?"
  let inserts = [username, question, encryptedAnswer, encryptedAnswer];
  addQnAQuery = mysql.format(addQnAQuery, inserts);

  con.query(addQnAQuery, (err, result) => {
    if(err){
      let error = "" + err;
      console.log("ERROR!")
      console.log(error);


      return res.end(error);
    }else{
      
      return res.end("inserted")
    }
  })
})


/*
* Purpose: Retrieves all user QNA's from the database
*
* Paramater: username - the users username
* Parameter: password - the users password
*  
* Return: "ERROR!" if an error occured, a JSON of the user's questions and answers otherwise
*/
app.get('/getQnA',(req, res) =>{
  const{username, password} = req.query;
  let getKey = Key.getKey(username, password);
  let getQuery = "SELECT question, encryptedAnswer FROM userinfo WHERE username = ?";
  let inserts = [username];
  getQuery = mysql.format(getQuery, inserts);
  let decryptedAnswer;
  let resultLen;                //length of the result object
  let responseMap = new Map();  // maps answers to questions

  con.query(getQuery, (err, result) => {
    if(err){
      let error = "" + err;
      console.log(error);
      return res.end(error);
    }else{  
      resultLen = result.length;

      //maps each decrypted answer to its questions
      for(let i = 0; i < resultLen; i++){
        decryptedAnswer = aes256.decrypt(getKey, result[i].encryptedAnswer);
        responseMap[result[i].question] = decryptedAnswer;
      }

      res.json(responseMap);
      }
    })

    
})
//getQnA?username=royhe62&password=no
app.listen(PORT, () => {
  console.log('Server Loaded on port ${PORT}');
})