var config;
var electronRequire;
var ipcRenderer;
var remote;

if (typeof process === 'object') {

  remote = require('electron').remote;

  config = remote.getGlobal('config');

  // preserve newlines, etc - use valid JSON
  config = config.replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f");

  // remove non-printable and other non-valid JSON chars
  config = config.replace(/[\u0000-\u0019]+/g,"");

  // Convert to JavaScript Object
  config = JSON.parse(config);

  // Use for non browserify requires
  electronRequire = require;

  // Use to communicate with Electron
  var ipcRenderer = require('electron').ipcRenderer;
}


