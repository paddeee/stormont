var config;
var electronRequire;
var ipc;
var remote;

if (typeof process === 'object') {

  remote = require('electron').remote;

  config = JSON.parse(remote.getGlobal('config'));

  // Use for non browserify requires
  electronRequire = require;

  // Use to communicate with Electron
  var ipc = require('ipc');
}
