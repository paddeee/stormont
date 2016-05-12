const electron = require('electron');
const electronApp = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const Menu = require("menu");
const ldap =  require('ldapjs');
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

var ldapPath;

// Check for LDAP
var checkForLDAP =  function () {

  return new Promise(function (resolve, reject) {

    // Check for LDAP
    LDAPExists()
      .then(function() {
        resolve();
      })
      .catch(function() {
        reject();
      });
  });
};

// Can we establish an LDAP connection
// ToDo: Need to manage LDAP connectivity checks from here. For now, just return true
var LDAPExists = function() {

  return new Promise(function (resolve, reject) {

    // In browser
    if (!ldap) {
      resolve();
    }

    var client = ldap.createClient({
      url: ldapPath,
      connectTimeout: 3000
    });

    client.on('connect', function() {
      console.log('Connected to LDAP');
      resolve();
    });

    client.on('error', function() {
      console.log('LDAP Error');
      resolve();
    });

    client.on('timeout', function() {
      console.log('LDAP timeout');
      reject();
    });

    client.on('connectError', function() {
      console.log('LDAP connect error');
      reject();
    });

    client.on('socketTimeout', function() {
      console.log('LDAP socket timeout');
      reject();
    });
  });
};

// Get the config file
var getConfig =  function () {

  return new Promise(function (resolve, reject) {

    var configDirectory = process.resourcesPath;
    var platformPath;

    if (process.platform != 'darwin') {
      platformPath = '/SITFConfig/ConfigWindows/';
    } else {
      platformPath = '/SITFConfig/ConfigOSX/';
    }

    fs.readFile(configDirectory + platformPath + '/appConfig.json', 'utf-8', function(err, data) {

      if (data) {
        global.config = data;
        ldapPath = JSON.parse(data).paths.ldap;
        resolve();
      } else if (err) {
        reject(err);
      }
    });
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electronApp.on('ready', function() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    webSecurity: false,
    width: 1024,
    height: 720
  });

  getConfig()
    .then(function() {
      console.log('Got config');
      mainWindow.loadURL('file://' + __dirname + '/splash.html');

      checkForLDAP()
        .then(function() {
          console.log('Got LDAP');
          setTimeout(function() {
            mainWindow.loadURL('file://' + __dirname + '/online.html');
          }, 2000);
        }.bind(this))
        .catch(function() {
          console.log('No LDAP');
          mainWindow.loadURL('file://' + __dirname + '/offline.html');
        }.bind(this));
    })
    .catch(function() {
      dialog.showErrorBox('Config File Missing', 'Please make sure the Config Directory resides in the Application.');
      reject();
    }.bind(this));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Create the Application's main menu
  var template = [{
    label: "Application",
    submenu: [
      { label: "About SITF EPE", selector: "orderFrontStandardAboutPanel:" },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function() { electronApp.quit(); }}
    ]}, {
    label: "Edit",
    submenu: [
      //{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      //{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      //{ type: "separator" },
      //{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      //{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];

  //Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

// Quit when all windows are closed.
electronApp.on('window-all-closed', function() {

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

ipcMain.on('show-open-dialog', function(event, property, type) {

  var selection;

  if (property === 'directory') {
    selection = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
  } else if (property === 'file') {

    if (type === '.dat') {

      selection = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Package', extensions: ['dat'] }
        ]
      });
    }
  }

  event.sender.send(property + '-selected', selection);
});
