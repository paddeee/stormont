'use strict';

var Reflux = require('reflux');

module.exports = Reflux.createActions([
  'loginAttempted',  // called by user attempting login
  'logOut'
]);
