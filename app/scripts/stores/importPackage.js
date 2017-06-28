'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var importFileAdapter = require('../adapters/loki-import-file-adapter.js');
var ImportPackageActions = require('../actions/importPackage.js');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
//var fsExtra = appMode === 'app' ? window.electronRequire('fs-extra') : null;

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ExportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportPackageActions],

  // When a directory of files is selected
  onPackageSelected: function(packageObject) {

    global.config = config;

    importFileAdapter.tempPackageDirectory = packageObject.packageLocation;

    this.createFileDatabase();
  },

  // Create empty loki db
  createFileDatabase: function() {

    dataSourceStore.dataSource = new loki('EPE.json');
    var sourceCollection = dataSourceStore.dataSource.addCollection(config.SourcesCollection.name);
    var sourceCollectionData = this.getSourceCollectionData();

    sourceCollection.insert(sourceCollectionData);

    this.message = 'importSuccess';
    this.trigger(this);
  },

  // Return array of Source File info
  getSourceCollectionData: function() {

    // REPLACE THIS WITH DATA RETRIEVED FROM FILES
    var obj1 = {};
    var obj2 = {};

    obj1['Full Name'] = 'KIN-10350 to KIN-10850.pdf';
    obj1['Short Name'] = 'KIN-10350 to KIN-10850.pdf';
    obj1['Linked File'] = 'KIN-10350 to KIN-10850.pdf';

    obj2['Full Name'] = 'KIN-8350 to KIN-10350.pdf';
    obj2['Short Name'] = 'KIN-8350 to KIN-10350.pdf';
    obj2['Linked File'] = 'KIN-8350 to KIN-10350.pdf';

    return [obj1, obj2];
  }
});
