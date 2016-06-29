'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var importFileAdapter = require('../adapters/loki-import-file-adapter.js');
var ImportPackageActions = require('../actions/importPackage.js');
var dataSourceStore = require('../stores/dataSource.js');
/*var eventsStore = require('../stores/events.js');
 var placesStore = require('../stores/places.js');
 var peopleStore = require('../stores/people.js');
 var sourcesStore = require('../stores/source.js');*/
var fsExtra = window.electronRequire('fs-extra');
var decompressZip = window.electronRequire('decompress-zip');
var encryptor = window.electronRequire('file-encryptor');
//var crypto = window.electronRequire('crypto');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ExportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportPackageActions],

  packagePassword: '',

  // Check if YubiKey is inserted
  // ToDO: For now always saying true. Need to add npm yub to check for real
  onPackageSelected: function(packageObject) {

    importFileAdapter.tempPackageDirectory = packageObject.packageLocation.substr(0, packageObject.packageLocation.lastIndexOf('.'));

    this.commenceImportProcess(packageObject);
  },

  // Start the chain of Promises that will handle the Import Process
  commenceImportProcess: function(packageObject) {

    // Create a Temporary Package Directory
    /*this.createTempDirectory()
      .then(function() {
        console.log('Temp Package Directory Created');

        // Decrypt zip file
        this.decryptPackage(packageObject)
          .then(function() {
            console.log('Package Decrypted');

            // Extract zip file to directory
            this.extractPackage()
              .then(function() {
                console.log('Zip File Extracted');

                // Extract zip file to directory
                this.deleteTempZipFile()
                  .then(function() {
                    console.log('Zip File Deleted');*/

                    // Load Loki DB into memory
                    this.loadDatabase()
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
                    /*}.bind(this));
                  .catch(function(reason) {
                    console.error(reason);
                    // CleanUp
                    this.deleteTempDirectory();
                    this.message = 'deleteZipFailure';
                    this.trigger(this);
                  }.bind(this));
              }.bind(this))
              .catch(function(reason) {
                console.error(reason);
                // CleanUp
                this.deleteTempDirectory();
                this.message = 'extractZipFailure';
                this.trigger(this);
              }.bind(this));
          }.bind(this))
          .catch(function(reason) {
            console.error(reason);
            // CleanUp
            this.deleteTempDirectory();
            this.message = 'decryptTempPackageFailure';
            this.trigger(this);
          }.bind(this));
      }.bind(this))
      .catch(function(reason) {
        console.error(reason);
        this.message = 'createTempPackageDirectoryFailure';
        this.trigger(this);
      }.bind(this));*/
  },

  // Decrypt a zip file using aes-256 and the package password
  decryptPackage: function (packageObject) {

    return new Promise(function (resolve, reject) {

      var packageName = packageObject.packageLocation;
      var zipPath = importFileAdapter.tempPackageDirectory + '/tempPackage.zip';
      var options = {
        algorithm: 'aes256'
      };

      // Decrypt file
      encryptor.decryptFile(packageName, zipPath, packageObject.packagePassword, options, function(err) {

        if (err) {
          reject('Error decrypting Zip file: ' + err);
        } else {
          resolve();
        }
      });

    }.bind(this));
  },

  // Extract contents of the zip file into a directory
  extractPackage: function () {

    return new Promise(function (resolve, reject) {

      var zipPath = importFileAdapter.tempPackageDirectory + '/tempPackage.zip';
      var unzipper = new decompressZip(zipPath);

      unzipper.on('error', function (err) {
        reject('Caught an error ' + err);
      });

      unzipper.on('extract', function () {
        resolve();
      });

      unzipper.on('progress', function (fileIndex, fileCount) {
        console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
      });

      // Extract Zip
      unzipper.extract({
        path: importFileAdapter.tempPackageDirectory
      });

    }.bind(this));
  },

  // Create a temporary Directory
  createTempDirectory: function() {

    return new Promise(function (resolve, reject) {

      // Create a temporary directory for package
      fsExtra.mkdirs(importFileAdapter.tempPackageDirectory, function(err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      });
    });
  },

  // Delete the temporary zip file
  deleteTempZipFile: function() {

    var zipPath = importFileAdapter.tempPackageDirectory + '/tempPackage.zip';

    return new Promise(function (resolve, reject) {

      fsExtra.remove(zipPath, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  },

  // Delete the temporary directory
  deleteTempDirectory: function() {

    return new Promise(function (resolve, reject) {

      fsExtra.remove(importFileAdapter.tempPackageDirectory, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  },

  // Load Database JSON File in to memory
  loadDatabase: function() {

    return new Promise(function (resolve) {

      dataSourceStore.dataSource = new loki('SITF.json', {
        adapter: importFileAdapter
      });

      dataSourceStore.dataSource.loadDatabase({}, function () {
        resolve();
      }.bind(this));
    });
  },
});
