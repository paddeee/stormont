'use strict';

const Reflux = require('reflux');
const ScreenActions = require('../actions/screen.js');
const electron = window.electronRequire('electron');

const fs = window.electronRequire('fs');
const path = window.electronRequire('path');
const dataSourceStore = require('../stores/dataSource.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ScreenActions, using onKeyname (or keyname) as callbacks
  listenables: [ScreenActions],

  user: null,

  onPublishScreen: function(publishObject) {

    var fileName = publishObject.fileName + '.png';
    var pdfName = publishObject.fileName + '.pdf';
    var windows = electron.remote.BrowserWindow.getAllWindows();
    var controllerWindow;
    var controllerWindowBounds;
    var rect = {
      x: 0,
      y: 0
    };

    this.message = {
      type: 'gatheringScreens'
    };

    this.trigger(this);

    controllerWindow = windows.filter(function (window) {
      return window.getTitle() === 'SITF Electronic Presentation of Evidence';
    })[0];

    controllerWindowBounds = controllerWindow.getContentSize();

    rect.width = controllerWindowBounds[0];
    rect.height = controllerWindowBounds[1];

    controllerWindow.capturePage(rect, function(image) {

      var screenshotPath = path.join(global.config.packagePath, fileName);
      var userName = dataSourceStore.dataSource.getCollection('Presentations').data[0].userName;

      var pdfObject = {
        fileName: publishObject.fileName,
        imagePath: screenshotPath,
        imageSize: controllerWindowBounds,
        pdfPath: path.join(global.config.packagePath, pdfName),
        userName: userName,
        ernRefs: publishObject.ernRefs,
        openOnSave: publishObject.openOnSave
      };

      fs.writeFile(screenshotPath, image.toPng(), function (error) {

        if (error) {

          this.message = {
            type: 'screenshotFailure',
            text: error
          };

          this.trigger(this);
          return console.error(error);
        }

        this.message = {
          type: 'screenshotSuccess',
          text: 'Saved screenshot to: ' + screenshotPath
        };

        // Send message to Electron
        ipcRenderer.send('screenshot-published', pdfObject);

        this.trigger(this);

      }.bind(this));
    }.bind(this));
  }
});
