module.exports = {    /*
    This function works by taking a password, then creating tha sha256 hash of that username repeated twice

    We then look at the first two numbers.

    We multiply the second number by 2 inorder to get the starting point.
    We add one to the starting number if the third number is odd.

    We then take 32 numbers, starting from the starting number, to get our key
    */
    getKey:function(username, password){
        let largeKeySha = require('node-forge');
        let largeKeyGenerator = largeKeySha.md.sha256.create();     //The forge object used to generate a large key
        let largeKey;
        let entry = username + password;
        let startingNumber;
        let thirdNumber;
        let key;


        largeKeyGenerator.update(entry);
        largeKey = largeKeyGenerator.digest().toHex();


        startingNumber = parseInt(largeKey[1], 16);
        thirdNumber = parseInt(largeKey[2], 16);
        
        if(thirdNumber % 2 != 0){
            startingNumber ++;
        }

        key = largeKey.substring(startingNumber, startingNumber + 32);

        return key;
    }
}