'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var importFileAdapter = require('../adapters/loki-import-file-adapter.js');
var ImportPackageActions = require('../actions/importPackage.js');
var dataSourceStore = require('../stores/dataSource.js');
var fsExtra = window.electronRequire('fs-extra');
var crypto = window.electronRequire('crypto');
var getRawBody = window.electronRequire('raw-body');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ExportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportPackageActions],

  packagePassword: '',

  // Check if YubiKey is inserted
  // ToDO: For now always saying true. Need to add npm yub to check for real
  onPackageSelected: function(packageObject) {

    importFileAdapter.tempPackageDirectory = packageObject.packageLocation;

    this.commenceImportProcess(packageObject);
  },

  // Start the chain of Promises that will handle the Import Process
  commenceImportProcess: function(packageObject) {

    // Decrypt the DB File
    this.decryptDatabaseFile(packageObject)
      .then(function(dbJSON) {
        console.log('DB File Decrypted');

        // Load Loki DB into memory
        this.loadDatabase(dbJSON)
          .then(function() {
            console.log('Database Loaded');

            // Send object out to all listeners when database loaded
            dataSourceStore.dataSource.message = {
              type: 'dataBaseLoaded'
            };

            // Add the package filesystem location so we can use it later for Publishing functionality
            global.config.packagePath = importFileAdapter.tempPackageDirectory;

            // Set packagePassword so we can access it if application locks
            this.packagePassword = packageObject.packagePassword;

            dataSourceStore.trigger(dataSourceStore);

            this.message = 'importSuccess';
            this.trigger(this);
          }.bind(this));
        }.bind(this))
      .catch(function(reason) {
        console.error(reason);
        this.message = 'dbDecryptionFailure';
        this.trigger(this);
      }.bind(this));
  },

  // Decrypt the database file
  decryptDatabaseFile: function(packageObject) {

    return new Promise(function (resolve, reject) {

      // Input file
      var dbStream = fsExtra.createReadStream(importFileAdapter.tempPackageDirectory + '/SITF.dat');

      // Decrypt content
      var decrypt = crypto.createDecipher('aes-256-ctr', packageObject.packagePassword);

      // Start pipe
      getRawBody(dbStream.pipe(decrypt))
        .then(function (buffer) {
          resolve(buffer.toString());
        })
        .catch(function (err) {
          console.log('Error decrypting DataBase file: ' + err);
          reject();
        });
    });
  },

  // Load Database JSON File in to memory
  loadDatabase: function(dbJSON) {

    return new Promise(function (resolve) {

      dataSourceStore.dataSource = new loki('SITF.json');

      dataSourceStore.dataSource.loadJSON(dbJSON, {});

      resolve();
    });
  }
});
