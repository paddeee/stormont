'use strict';

var Reflux = require('reflux');
var UserActions = require('../actions/users.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in UserActions, using onKeyname (or keyname) as callbacks
  listenables: [UserActions],

  user: null,

  // When a user has attempted login
  loginAttempted: function (userLoginObject) {

    var status = 'loggedin';

    this.user = this.createUserObject(status, userLoginObject);

    // ToDo: LDAP - for now just trigger successful login
    this.trigger(this.user);
  },

  // Return a user object for listeners to consume
  createUserObject: function (status, userLoginObject) {

    var userObject = {
      status: status
    };

    if (status === 'loggedin') {
      userObject.userName = userLoginObject.username;
      userObject.role = 'admin';
      userObject.message = userObject.userName + ' has logged in as ' + userObject.role;
      return userObject;

    } else if (status === 'loggedout') {
      userObject.message = 'Login Failed';
      return userObject;

    } else {
      console.log('Log: Login Fail');
    }
  }
});
