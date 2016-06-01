'use strict';

const Reflux = require('reflux');
const ScreenActions = require('../actions/screen.js');
const electron = window.electronRequire('electron');
const desktopCapturer = electron.desktopCapturer;
//const shell = electron.shell;

const fs = window.electronRequire('fs');
const path = window.electronRequire('path');
const dataSourceStore = require('../stores/dataSource.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ScreenActions, using onKeyname (or keyname) as callbacks
  listenables: [ScreenActions],

  user: null,

  onPublishScreen: function(publishObject) {

    var options;
    var fileName = publishObject.fileName + '.png';
    var pdfName = publishObject.fileName + '.pdf';

    this.message = {
      type: 'gatheringScreens'
    };

    this.trigger(this);

    options = {
      types: ['window'],
      thumbnailSize: {
        width: 1024,
        height: 768
      }
    };

    desktopCapturer.getSources(options, function (error, sources) {

      if (error) {
        return console.log(error);
      }

      sources.forEach(function (source) {

        if (source.name === 'SITF Electronic Presentation of Evidence') {

          var screenshotPath = path.join(global.config.packagePath, fileName);
          var userName = dataSourceStore.dataSource.getCollection('Presentations').data[0].userName;

          var pdfObject = {
            fileName: publishObject.fileName,
            imagePath: screenshotPath,
            pdfPath: path.join(global.config.packagePath, pdfName),
            userName: userName,
            ernRefs: [{
              ref: 'A12344567',
              description: 'Kosovo.mp4'
            },
            {
              ref: 'B12344567',
              description: 'KLA.pdf'
            }]
          };

          fs.writeFile(screenshotPath, source.thumbnail.toPng(), function (error) {

            if (error) {

              this.message = {
                type: 'screenshotFailure',
                text: error
              };

              this.trigger(this);
              return console.error(error);
            }

            // View file if user requested
            /*if (publishObject.openOnSave === 'open') {
              shell.openItem(screenshotPath);
            }*/

            this.message = {
              type: 'screenshotSuccess',
              text: 'Saved screenshot to: ' + screenshotPath
            };

            // Send message to Electron
            ipcRenderer.send('create-pdf', pdfObject);

            this.trigger(this);

          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  }
});
