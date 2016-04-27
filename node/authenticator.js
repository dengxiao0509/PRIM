///////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2014, Tavendo GmbH and/or collaborators. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//  1. Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//
//  2. Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//  POSSIBILITY OF SUCH DAMAGE.
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('autobahn');
var fs = require('fs');

var USERDB;
var file_path = "/tmp/users.txt";

// A poor man's user database.
//
if(fs.existsSync(file_path)) {
   var USERDB_json = fs.readFileSync(file_path, 'utf8');
   if(USERDB_json == "") {
      USERDB = {"registerUser":{"secret":"registerUser","role":"frontend"}};
   }
   else {
      USERDB = JSON.parse(USERDB_json);
   }
}
else {
   console.log("users.txt doesn't exist.");
   USERDB = {"registerUser":{"secret":"registerUser","role":"frontend"}};
}

/*
var USERDB = {
   // A user with an unsalted password
   'joe': {
      'secret': 'secret2',
      'role': 'frontend'
   },
   // A user with a salted password
   'peter': {
      // autobahn.auth_cra.derive_key("secret1", "salt123", 100, 16);
      'secret': 'prq7+YkJ1/KlW1X0YczMHw==',
      'role': 'frontend',
      'salt': 'salt123',
      'iterations': 100,
      'keylen': 16
   },
   'xiao': {
      'secret':'xiao',
      'role':'frontend'
   }
};
*/



// This is our custom authenticator procedure that we register
// under URI "com.example.authenticate", and that will be called
// by Crossbar.io to authenticate other WAMP session (e.g. browser frontends)
//
function authenticate (args) {
   var realm = args[0];
   var authid = args[1];
   var details = args[2];

   console.log("authenticate called:", realm, authid, details);

   if (USERDB[authid] !== undefined) {
      return USERDB[authid];
   } else {
      throw "no such user";
   }
}


// This challenge callback will authenticate our custom authenticator above _itself_
//
function onchallenge (session, method, extra) {

   // console.log("onchallenge", method, extra);

   if (method === "wampcra") {

      // console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");

      return autobahn.auth_cra.sign(process.argv[5], extra.challenge);

   } else {
      throw "don't know how to authenticate using '" + method + "'";
   }
}

//args: username and pw
function registerUser(args){
   var username = args[0];
   var pw = args[1];

   //fields control
   ///

   //if username already exists
   if(username in USERDB) {
      return "duplicate_username";
   }

   if(pw.length < 6){
      return "short_pw";
   }

   USERDB[username] = {"secret":pw,"role":"frontend"};

   //renew User list in external file
   var USERDB_json = JSON.stringify(USERDB);
   fs.writeFile(file_path, '', function(err) {
      if(err) {
         return console.log(err);
      }
      // console.log("The file was cleared!");
   });

   fs.writeFile(file_path, USERDB_json, function(err) {
      if(err) {
         return console.log(err);
      }
      // console.log("The file was saved!");
   });

   return "ok";
}

var connection = new autobahn.Connection({
   url: process.argv[2],
   realm: process.argv[3],

   // The following authentication information is for authenticating the
   // custom authenticator component _itself_
   //
   authid: process.argv[4],
   authmethods: ["wampcra"],
   onchallenge: onchallenge
});


connection.onopen = function (session) {

   console.log("custom authenticator connected");
   session.register('sdl.auth.authenticate', authenticate).then(
      function () {
         console.log("Ok, custom WAMP-CRA authenticator procedure registered");
      },
      function (err) {
         console.log("Uups, could not register custom WAMP-CRA authenticator", err);
      }
   );

   session.register('sdl.auth.registerUser',registerUser).then(
      function() {
         console.log("OK, custom WAMP-CRA registerUser procedure registered");
      },
      function(err){
         console.log("Uups, could not register custom WAMP-CRA registerUser",err);
      }
   );
};


connection.onclose = function (reason, details) {
   console.log("Connection lost:", reason, details);
}


connection.open();

