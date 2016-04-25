const electron = require('electron');
const electronApp = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const Menu = require("menu");
const ldap =  require('ldapjs');

var presentationMode;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Set the dataSource Object based on the availability of LDAP
var checkForLDAP =  function () {

  return new Promise(function (resolve) {

    // Check for LDAP
    LDAPExists()
    .then(function() {
        resolve();
    }.bind(this))
    .catch(function(error) {
        console.error(error);
        reject();
    }.bind(this));
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
      url: 'ldap://ldap.forumsys.com:389'
    });

    client.bind('cn=read-only-admin,dc=example,dc=com', 'password', function (err) {

      if (err) {
        client.unbind();
        reject('Error connecting to LDAP: ' + err);
      }

      // Can unbind connection now we know online is available
      client.unbind(function(err) {

        if (err) {
          reject('Problem unbinding from LDAP: ' + err);
        }

        resolve();
      });
    });
  });
};


// Quit when all windows are closed.
electronApp.on('window-all-closed', function() {

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electronApp.on('ready', function() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    webSecurity: false,
    width: 1024,
    height: 720
  });

  checkForLDAP()
    .then(function() {
      mainWindow.loadURL('file://' + __dirname + '/online.html');
    }.bind(this))
    .catch(function() {
      mainWindow.loadURL('file://' + __dirname + '/offline.html');
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
