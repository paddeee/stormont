'use strict';

//var ldap =  global.config ? window.electronRequire('ldapjs') : null;
var ActiveDirectory = global.config ? window.electronRequire('activedirectory') : null;
var Reflux = require('reflux');
var UserActions = require('../actions/users.js');
var config = global.config ? global.config : require('../config/config.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in UserActions, using onKeyname (or keyname) as callbacks
  listenables: [UserActions],

  user: null,

  // Temporary function while testing different roles
  // ToDo: Get rid of this when LDAP is done
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
      //if (!ActiveDirectory) {
        resolve(userLoginObject);
      //}

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
          reject('ERROR: '+JSON.stringify(err));
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
