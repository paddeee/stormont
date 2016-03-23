'use strict';

var ldap =  global.packagedApp ? window.electronRequire('ldapjs') : null;
var Reflux = require('reflux');
var UserActions = require('../actions/users.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in UserActions, using onKeyname (or keyname) as callbacks
  listenables: [UserActions],

  user: null,

  // Temporary function while testing different roles
  // ToDo: Get rid of this when LDAP is done
  init: function() {

    this.user = {
      status: 'loggedin',
      userName: 'Paddy',
      role: 'admin'
    };

    this.trigger(this.user);
  },

  // When a user has attempted login
  loginAttempted: function (userLoginObject) {

    var status;

    // Authenticate user against LDAP directory
    this.authenticateUser(userLoginObject)
    .then(function(userObject) {

        // ToDo: LDAP - for now just trigger successful login
        status = 'loggedin';

        this.user = this.createUserObject(status, userObject);

        this.trigger(this.user);
      }.bind(this))
    .catch(function(err) {
      console.error(err);
    });

    // ToDo: LDAP - for now just trigger successful login
    /*status = 'loggedin';

    this.user = this.createUserObject(status, userLoginObject);

    this.trigger(this.user);*/
  },

  // Authenticate User
  authenticateUser: function(userLoginObject) {

    return new Promise(function (resolve, reject) {

      // In browser
      //if (!ldap) {
        resolve(userLoginObject);
      //}

      var client = ldap.createClient({
        url: 'ldap://ldap.forumsys.com:389'
      });

      var options = {
        filter: '(uid=' + userLoginObject.username + ')',
        scope: 'sub'
      };

      // Search for User in LDAP
      client.search('dc=example,dc=com', options, function(err, res) {

        var ldapUsers = [];

        if (err) {
          reject('General Error searching LDAP for User: ' + err);
        }

        res.on('searchEntry', function(entry) {
          ldapUsers.push(entry.object);
        });
        res.on('error', function(err) {
          reject('Search Failed: ' + err.message);
        });
        res.on('end', function() {
          resolve(ldapUsers);
        });
      });
    });
  },

  // Return a user object for listeners to consume
  createUserObject: function (status, userLoginObject) {

    var userObject = {
      status: status
    };

    if (status === 'loggedin') {
      userObject.userName = userLoginObject.username;

      // ToDo: Remove this when ldap set up
      switch (userObject.userName) {
        case 'User':
          userObject.role = 'user';
          break;
        case 'Gatekeeper':
          userObject.role = 'gatekeeper';
          break;
        case 'Authoriser':
          userObject.role = 'authoriser';
          break;
        case 'Admin':
          userObject.role = 'admin';
          break;
        case 'User2':
          userObject.role = 'user';
          break;
        case 'Gatekeeper2':
          userObject.role = 'gatekeeper';
          break;
        case 'Authoriser2':
          userObject.role = 'authoriser';
          break;
        case 'Admin2':
          userObject.role = 'admin';
          break;
        default:
          console.log('Sorry, not a valid user');
      }

      userObject.message = userObject.userName + ' has logged in as ' + userObject.role;
      return userObject;

    } else if (status === 'loggedout') {
      userObject.message = 'Login Failed';
      return userObject;

    } else {
      console.warn('Log: Login Fail');
    }
  }
});
