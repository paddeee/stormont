'use strict';

const Reflux = require('reflux');
const moment = require('moment');
const config = global.config ? global.config : require('../config/config.js');
const usersStore = require('../stores/users.js');
const fsExtra = global.config ? window.electronRequire('fs-extra') : null;
const path = global.config ? window.electronRequire('path') : null;
const winston = global.config ? window.electronRequire('winston') : null;

module.exports = Reflux.createStore({

  init: function() {

    if (global.config) {

      // Instantiate the logger
      this.logger = new (winston.Logger)({
        transports: [
          new (winston.transports.File)({
            name: 'info-file',
            filename: path.join(config.paths.logPath, '/info.log'),
            level: 'info',
            timestamp: function () {
              return moment().format('Do MMMM YYYY, h:mm:ss a');
            }
          }),
          new (winston.transports.File)({
            name: 'error-file',
            filename: path.join(config.paths.logPath, '/error.log'),
            level: 'error',
            timestamp: function () {
              return moment().format('Do MMMM YYYY, h:mm:ss a');
            }
          })
        ]
      });
    }
  },

  // Log when a data is imported
  dataImported: function(importObject) {

    importObject.userName = usersStore.user.userName;

    // Check log file exists
    fsExtra.ensureFile(path.join(config.paths.logPath, '/info.log'), function (err) {

      if (err) {

        this.message = {
          type: 'generalLoggingFailure',
          text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
        };

        this.trigger(this);
      } else {

        this.logger.log('info', 'CASEMAP DATA IMPORTED: %s imported by %s', importObject.directoryName, importObject.userName, function (err) {

          if (err) {

            this.message = {
              type: 'generalLoggingFailure',
              text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
            };

            this.trigger(this);
          }
        }.bind(this));
      }
    }.bind(this));
  },

  // Log when a data import fails
  dataImportFailed: function(importObject) {

    importObject.userName = usersStore.user.userName;

    // Check log file exists
    fsExtra.ensureFile(path.join(config.paths.logPath, '/info.log'), function (err) {

      if (err) {

        this.message = {
          type: 'generalLoggingFailure',
          text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
        };

        this.trigger(this);
      } else {

        this.logger.log('info', 'CASEMAP DATA IMPORT FAILED: %s imported by %s -- %s', importObject.directoryName, importObject.userName, importObject.errorMessage, function (err) {

          if (err) {

            this.message = {
              type: 'generalLoggingFailure',
              text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
            };

            this.trigger(this);
          }
        }.bind(this));
      }
    }.bind(this));
  },

  // Log when a package is created
  packageCreated: function(packageObject) {

    packageObject.userName = usersStore.user.userName;

    // Check log file exists
    fsExtra.ensureFile(path.join(config.paths.logPath, '/info.log'), function (err) {

      if (err) {

        this.message = {
          type: 'generalLoggingFailure',
          text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
        };

        this.trigger(this);
      } else {

        this.logger.log('info', 'PACKAGE CREATED: %s created by %s', packageObject.presentationName, packageObject.userName, function (err) {

          if (err) {

            this.message = {
              type: 'generalLoggingFailure',
              text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
            };

            this.trigger(this);
          }
        }.bind(this));
      }
    }.bind(this));
  },

  // Log when a package is updated
  packageUpdated: function(packageObject) {

    packageObject.userName = usersStore.user.userName;

    // Check log file exists
    fsExtra.ensureFile(path.join(config.paths.logPath, '/info.log'), function (err) {

      if (err) {

        this.message = {
          type: 'generalLoggingFailure',
          text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
        };

        this.trigger(this);
      } else {

        this.logger.log('info', 'PACKAGE UPDATED: %s updated by %s', packageObject.presentationName, packageObject.userName, function (err) {

          if (err) {

            this.message = {
              type: 'generalLoggingFailure',
              text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
            };

            this.trigger(this);
          }
        }.bind(this));
      }
    }.bind(this));
  },

  // Log when a package is exported
  packageExported: function(packageObject) {

    packageObject.userName = usersStore.user.userName;

    // Check log file exists
    fsExtra.ensureFile(path.join(config.paths.logPath, '/info.log'), function (err) {

      if (err) {

        this.message = {
          type: 'generalLoggingFailure',
          text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
        };

        this.trigger(this);
      } else {

        this.logger.log('info', 'PACKAGE EXPORTED: %s exported by %s', packageObject.presentationName, packageObject.userName, function (err) {

          if (err) {

            this.message = {
              type: 'generalLoggingFailure',
              text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
            };

            this.trigger(this);
          }
        }.bind(this));
      }
    }.bind(this));
  }
});
