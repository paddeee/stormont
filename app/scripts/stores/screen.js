'use strict';

const Reflux = require('reflux');
const ScreenActions = require('../actions/screen.js');
const electron = window.electronRequire('electron');
const desktopCapturer = electron.desktopCapturer;
const shell = electron.shell;

const fs = window.electronRequire('fs');
const path = window.electronRequire('path');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ScreenActions, using onKeyname (or keyname) as callbacks
  listenables: [ScreenActions],

  user: null,

  onPublishScreen: function(publishObject) {

    var options;
    var fileName = publishObject.fileName + '.png';

    this.message = {
      type: 'gatheringScreens'
    };

    this.trigger(this);

    const thumbSize = this.determineScreenShotSize();

    options = {
      types: ['window'],
      thumbnailSize: thumbSize
    };

    desktopCapturer.getSources(options, function (error, sources) {

      if (error) {
        return console.log(error);
      }

      sources.forEach(function (source) {

        if (source.name === 'SITF Electronic Presentation of Evidence') {

          const screenshotPath = path.join(global.config.packagePath, fileName);

          fs.writeFile(screenshotPath, source.thumbnail.toPng(), function (error) {

            if (error) {

              this.message = {
                type: 'publishFailure',
                text: error
              };

              this.trigger(this);
              return console.error(error);
            }

            // View file if user requested
            if (publishObject.openOnSave === 'open') {
              shell.openItem(screenshotPath);
            }

            this.message = {
              type: 'publishSuccess',
              text: 'Saved screenshot to: ' + screenshotPath
            };

            this.trigger(this);

          }.bind(this));
        }
      }.bind(this));
    }.bind(this));
  },

  determineScreenShotSize: function() {

    const windowSize = remote.getCurrentWindow().getBounds();

    return {
      width: windowSize.width,
      height: windowSize.height
    };
  }
});
