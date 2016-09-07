'use strict';

//var ldap =  global.config ? window.electronRequire('ldapjs') : null;
var ActiveDirectory = global.config ? window.electronRequire('activedirectory') : null;
var Reflux = require('reflux');
var UserActions = require('../actions/users.js');
var config = appMode === 'app' ? global.config : require('../config/config.js');
var roles = appMode === 'app' ? global.roles : require('../config/roles.js');

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
        .catch(function() {
          this.user.status = 'loginError';
          this.user.message = 'Please contact IT Support if you need to use this application.';
          this.trigger(this.user);
        }.bind(this));

      }.bind(this))
    .catch(function(error) {

      this.user.status = 'loginError';
      this.user.message = 'Please contact IT Support if you need to use this application.';
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

  // Return a user object for listeners to consume
  createUserObject: function (userLoginObject) {

    return new Promise(function (resolve, reject) {

      var userObject;

      userObject = roles.users.filter(function(user) {
        return user.userName === userLoginObject.username;
      })[0];

      // If user matched in roles file
      if (userObject) {

        if (userObject.role === 'no-login') {
          reject(userObject);
        } else {
          userObject.status = 'loggedin';
          userObject.message = userObject.userName + ' has logged in with ' + userObject.role + ' permissions';
        }

      // If no match in roles file log in as A User
      } else {

        userObject = {
          userName: userLoginObject.username,
          role: 'user',
          message: userLoginObject.username + ' has logged in with User permissions',
          status: 'loggedin'
        };
      }

      resolve(userObject);
    });
  },

  // Logout user
  logOut: function() {

    this.user = {
      status: 'loggedout',
      userName: '',
      role: ''
    };

    this.trigger(this.user);
  }
});
