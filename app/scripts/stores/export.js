'use strict';

var Reflux = require('reflux');
var ExportActions = require('../actions/export.js');
var dataSourceStore = require('../stores/dataSource.js');
var fs = window.electronRequire('fs');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ImportActions, using onKeyname (or keyname) as callbacks
  listenables: [ExportActions],

  packagePassword: '',

  // Check if YubiKey is inserted
  // ToDO: For now always saying true. Need to add npm yub to check for real
  onYubiKeyCheck: function() {

    var isYubiKeyInserted = true;

    if (isYubiKeyInserted) {
      this.message = 'yubiKeyInserted';
    } else {
      this.message = 'noYubiKey';
    }

    this.trigger(this);
  },

  // Export a presentation to the filesystem
  onExportPresentation: function (presentationObject) {

    // Set the package password
    this.packagePassword = presentationObject.packagePassword;

    // Create a temporary directory for database file and related source files
    console.log(fs);

    // Get loki Source Objects
    console.log(this.getLokiSourceObjects(presentationObject.presentationName));
  },

  // Get an array of loki Source objects that we can use to copy files across
  getLokiSourceObjects: function(presentationName) {

    var sourceObjects;

    // ToDO: In unlikely case of no source collection, don't need to copy source files
    if (!dataSourceStore.dataSource.getCollection('Source')) {

    }

    // If a filter has been applied, only get selected source records otherwise get all
    if (dataSourceStore.dataSource.getCollection('Source').chain(presentationName)) {
      sourceObjects = dataSourceStore.dataSource.getCollection('Source').chain(presentationName).data();
    } else {
      sourceObjects = dataSourceStore.dataSource.getCollection('Source').data;
    }

    return sourceObjects;
  }
});
