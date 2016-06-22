'use strict';

const Reflux = require('reflux');
const moment = require('moment');
const config = global.config ? global.config : require('../config/config.js');
const LoggingActions = require('../actions/logging.js');
const dataSourceStore = require('../stores/dataSource.js');
const fsExtra = global.config ? window.electronRequire('fs-extra') : null;
const path = global.config ? window.electronRequire('path') : null;
const winston = window.electronRequire('winston');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ScreenActions, using onKeyname (or keyname) as callbacks
  listenables: [LoggingActions],

  init: function() {

    // Instantiate the logger
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.File)({
          name: 'info-file',
          filename: path.join(config.paths.logPath, '/info.log'),
          level: 'info'
        }),
        new (winston.transports.File)({
          name: 'error-file',
          filename: path.join(config.paths.logPath, '/error.log'),
          level: 'error'
        })
      ]
    });
  },

  dataImported: function(importObject) {

    importObject.userName = dataSourceStore.dataSource.getCollection('Presentations').data[0].userName;
    importObject.logDate = moment().format('Do MMMM YYYY, h:mm:ss a');

    // Check log file exists
    fsExtra.ensureFile(path.join(config.paths.logPath, '/info.log'), function (err) {

      if (err) {

        this.message = {
          type: 'generalLoggingFailure',
          text: 'There was a problem writing to logfile:' + config.paths.logPath + '/info.log. Please check file permissions.'
        };

        this.trigger(this);
      } else {

        this.logger.log('info', 'CaseMap Data Imported: User "%s" imported Directory Name - %s on %s', importObject.userName, importObject.directoryName, importObject.logDate, function (err) {

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

  packageCreated: function() {

  },

  packageUpdated: function() {

  },

  packageExported: function() {

  }
});
