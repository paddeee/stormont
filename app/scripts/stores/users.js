'use strict';

//var ldap =  global.config ? window.electronRequire('ldapjs') : null;
var ActiveDirectory = global.config ? window.electronRequire('activedirectory') : null;
var Reflux = require('reflux');
var UserActions = require('../actions/users.js');
var config = global.config ? global.config : require('../config/config.js');
var roles = global.roles ? global.roles : require('../config/roles.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in UserActions, using onKeyname (or keyname) as callbacks
  listenables: [UserActions],

  user: null,

  // Only here to deep link as a user during development in browser
  init: function() {

    this.user = {
      status: 'loggedin',
      userName: 'Lena',
      role: 'gatekeeper'
    };

    this.trigger(this.user);
  },

  // When a user has attempted login
  loginAttempted: function (userLoginObject) {

    // Authenticate user against LDAP directory
    this.authenticateUser(userLoginObject)
    .then(function(userObject) {

      this.createUserObject(userObject)
        .then(function(user) {
          this.user = user;
          this.trigger(this.user);
        }.bind(this))
        .catch(function(user) {
          console.error(user);
          this.user = user;
          this.trigger(this.user);
        }.bind(this));

      }.bind(this))
    .catch(function(error) {

      console.error(error);
      this.user.status = 'loggedout';
      this.user.message = error;
      this.trigger(this.user);
    }.bind(this));
  },

  // Authenticate User against LDAP
  authenticateUser: function(userLoginObject) {

    return new Promise(function (resolve, reject) {

      // In browser
      if (!ActiveDirectory) {
        resolve(userLoginObject);
      }

      var userName = userLoginObject.username + '@' + config.ldap.domain;
      var password = userLoginObject.password;

      var ldapConfig = {
        url: config.ldap.url,
        baseDN: config.ldap.baseDN,
        username: userName,
        password: password
      };

      var activeDirectory = new ActiveDirectory(ldapConfig);

      activeDirectory.authenticate(userName, password, function(err, auth) {
        if (err) {
          reject(err);
        }

        if (auth) {
          console.log('Authenticated!');
          resolve(userLoginObject);
        }
        else {
          reject('Authentication failed!');
        }
      });
    });
  },

  /*

   samaccountname

   var opts = {
   filter: '(&(l=Seattle)(email=*@foo.com))',
   scope: 'sub',
   attributes: ['dn', 'sn', 'cn']
   };

   client.search('o=example', opts, function(err, res) {
   assert.ifError(err);

   res.on('searchEntry', function(entry) {
   console.log('entry: ' + JSON.stringify(entry.object));
   });
   res.on('searchReference', function(referral) {
   console.log('referral: ' + referral.uris.join());
   });
   res.on('error', function(err) {
   console.error('error: ' + err.message);
   });
   res.on('end', function(result) {
   console.log('status: ' + result.status);
   });
   });
   */

  // Return a user object for listeners to consume
  createUserObject: function (userLoginObject) {

    return new Promise(function (resolve, reject) {

      var userObject;

      userObject = roles.users.filter(function(user) {
        return user.userName === userLoginObject.username;
      })[0];

      // If no user matched in roles file
      if (userObject) {

        userObject.status = 'loggedin';

        userObject.message = userObject.userName + ' has logged in as ' + userObject.role;

        resolve(userObject);

      } else {

        userObject = {
          message: 'User does not exist in Application',
          status: 'loggedout'
        };

        reject(userObject);
      }
    });
  }
});
