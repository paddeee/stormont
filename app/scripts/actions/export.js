'use strict';

var Reflux = require('reflux');

module.exports = Reflux.createActions([
  'yubiKeyCheck',
  'exportPresentation'     // called by user hitting export button
]);
