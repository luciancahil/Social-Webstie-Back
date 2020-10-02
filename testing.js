//npm install express mysql cors aes256


var aes256 = require('aes256');
const express = require('express');
const cors = require('cors');
const app = express();
const {PORT = 4000} = process.env
const mysql = require('mysql');
const Key = require('./key');
 
//var key = 'asdfl;sdjlkfjlk;asdlkj';
//var plaintext = 'my plaintext message';
 
//var encrypted = aes256.encrypt(key, plaintext);
//var decrypted = aes256.decrypt(key, encrypted);

console.log(Key.getKey("Hello", "General"));
console.log(Key.getKey("Hello", "Monkeys"));

app.get('/', (req, res) =>{
    res.end("got to /login for login info")
  })

app.listen(PORT, () => {
console.log('Server Loaded on port ${PORT}');
})