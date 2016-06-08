const electron = require('electron');
const {app} = electron;  // Module to control application life.
const {BrowserWindow} = electron;  // Module to create native browser window.
const {ipcMain} = electron;
const {dialog} = electron;
//const Menu = require("menu");
const fs = require('fs');

/*
Networked: 0
Offline/Court: 1
 */
const buildType = 1;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Get the config file
var getConfig =  function () {

  return new Promise(function (resolve, reject) {

    var configDirectory = process.resourcesPath;

    fs.readFile(configDirectory + '/appConfig.json', 'utf-8', function(err, data) {

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
app.on('ready', function() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    webSecurity: false,
    width: 1024,
    height: 720
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  if (buildType === 1) {

    // Create the publish window.
    publishWindow = new BrowserWindow({
      webSecurity: false,
      width: 1024,
      height: 720,
      show: true
    });

    publishWindow.loadURL('file://' + __dirname + '/publish.html');

    publishWindow.webContents.openDevTools();
  }

  getConfig()
    .then(function() {
      console.log('Got config');

      switch(buildType) {
        case 0:
          mainWindow.loadURL('file://' + __dirname + '/online.html');
          break;
        case 1:
          mainWindow.loadURL('file://' + __dirname + '/offline.html');
          break;
        case 2:
          mainWindow.loadURL('file://' + __dirname + '/offline.html');
          break;
        default:
          dialog.showErrorBox('Error with Build: No Valid Build Type specified');
      }
    })
    .catch(function() {
      dialog.showErrorBox('Config File Missing', 'Please make sure the Config Directory resides in the Application.');
      reject();
    }.bind(this));




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
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
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
app.on('window-all-closed', function() {

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
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

// Send message to publish page to generate HTML with relevant data.
ipcMain.on('create-pdf', function(event, pdfObject) {

  publishWindow.webContents.send('create-pdf', pdfObject);
});

// Create and save the PDF.
ipcMain.on('save-pdf', function(event, pdfObject) {

  publishWindow.webContents.printToPDF({}, function(error, data) {

    if (error) {
      console.log(error);
    }

    fs.writeFile(pdfObject.pdfPath, data, function(error) {

      if (error) {
        console.log(error);
      }
    });
  });
});
