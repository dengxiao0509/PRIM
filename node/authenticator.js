///////////////////////////////////////////////////////////////////////////////
//  NodeJS application
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('autobahn');
var fs = require('fs');

var USERDB;
var file_path = "/tmp/users.txt";


if(fs.existsSync(file_path)) {
   var USERDB_json = fs.readFileSync(file_path, 'utf8');
   if(USERDB_json == "") {
      USERDB = {"registerUser":{"secret":"registerUser","role":"frontend"}};  //defaut account used to open a session for registering
   }
   else {
      USERDB = JSON.parse(USERDB_json);
   }
}
else {
   console.log("users.txt doesn't exist.");
   USERDB = {"registerUser":{"secret":"registerUser","role":"frontend"}};
}


// This is our custom authenticator procedure that we register
// under URI "sdl.auth.authenticate", and that will be called
// by Crossbar.io to authenticate other WAMP session (e.g. browser frontends)
function authenticate (args) {
   var realm = args[0];
   var authid = args[1];
   var details = args[2];

   // console.log("authenticate called:", realm, authid, details);

   if (USERDB[authid] !== undefined) {
      return USERDB[authid];
   } else {
      throw "no such user";
   }
}


// This challenge callback will authenticate our custom authenticator above _itself_
function onchallenge (session, method, extra) {

   // console.log("onchallenge", method, extra);

   if (method === "wampcra") {

      // console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");

      return autobahn.auth_cra.sign(process.argv[5], extra.challenge);

   } else {
      throw "don't know how to authenticate using '" + method + "'";
   }
}


var connection = new autobahn.Connection({
   url: process.argv[2],
   realm: process.argv[3],

   // The following authentication information is for authenticating the
   // custom authenticator component _itself_
   authid: process.argv[4],
   authmethods: ["wampcra"],
   onchallenge: onchallenge
});


connection.onopen = function (session) {

   console.log("custom authenticator connected");

   // Register an user, if valid, save to user.txt
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
      });

      fs.writeFile(file_path, USERDB_json, function(err) {
         if(err) {
            return console.log(err);
         }
      });


      session.publish("sdl.auth.onChangeUser",["add",username]);

      return "ok";
   }

   function getUsers(){
      //users
      var userNames = [];
      if(fs.existsSync(file_path)) {
          var users_json = fs.readFileSync(file_path, 'utf8');
          if(users_json == "") {
              var users = {};
          }
          else {
             var users = JSON.parse(users_json);

             for(var userN in users){
                userNames.push(userN);
             }
          }
      }
      else {
          var users = {};
      }
      return userNames;
   }

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

   session.register('sdl.auth.getUsers',getUsers).then(
       function() {
          console.log("OK, custom WAMP-CRA getUsers procedure registered");
       },
       function(err){
          console.log("Uups, could not register custom WAMP-CRA getUsers",err);
       }
   );
};


connection.onclose = function (reason, details) {
   console.log("Connection lost:", reason, details);
}


connection.open();

