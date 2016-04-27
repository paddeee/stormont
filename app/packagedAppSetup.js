var ipc;
var config;
var electronRequire;
var remote;

if (typeof process === 'object') {

  remote = require('electron').remote;

  // Use for non browserify requires
  electronRequire = require;

  // Use to communicate with Electron
  var ipc = require('ipc');

  config = JSON.parse(remote.getGlobal('config'));

  //
  //packagedApp = ipcRenderer.sendSync('is-packaged-app', 'Is Packaged App?');
  //alert('Packaged App ' + packagedApp);
}
