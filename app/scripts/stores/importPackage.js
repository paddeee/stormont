'use strict';

var Reflux = require('reflux');
var config = global.config;
//var loki = require('lokijs');
var importFileAdapter = require('../adapters/loki-import-file-adapter.js');
var ImportPackageActions = require('../actions/importPackage.js');
var dataSourceStore = require('../stores/dataSource.js');
/*var eventsStore = require('../stores/events.js');
 var placesStore = require('../stores/places.js');
 var peopleStore = require('../stores/people.js');
 var sourcesStore = require('../stores/source.js');*/
var fsExtra = window.electronRequire('fs-extra');
var extract = require('extract-zip');
var fs = window.electronRequire('fs');
var encryptor = window.electronRequire('file-encryptor');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ExportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportPackageActions],

  packagePassword: '',

  // Check if YubiKey is inserted
  // ToDO: For now always saying true. Need to add npm yub to check for real
  onPackageSelected: function(packageObject) {

    console.log(fs);

    importFileAdapter.tempPackageDirectory = packageObject.packageLocation.substr(0, packageObject.packageLocation.lastIndexOf('.'));

    this.commenceImportProcess(packageObject);
  },

  // Start the chain of Promises that will handle the Import Process
  commenceImportProcess: function(packageObject) {

    // Create promise for zipping the Temporary Directory
    /*zipTempDirectory = new Promise(function (resolve, reject) {

     // Add artificial timeout to make sure the directory is ready with all its contents
     setTimeout(function() {
     zipFolder(exportFileAdapter.tempExportDirectory, exportFileAdapter.tempExportDirectory + '.zip', function(err) {
     if (err) {
     reject(err);
     } else {
     resolve();
     }
     });
     }, 100);
     });*/

    // Create a Temporary Package Directory
    this.createTempDirectory()
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


              }.bind(this))
              .catch(function(reason) {
                console.error(reason);
                this.message = 'extractZipFailure';
                this.trigger(this);
              }.bind(this));
          }.bind(this))
          .catch(function(reason) {
            console.error(reason);
            this.message = 'decryptTempPackageFailure';
            this.trigger(this);
          }.bind(this));
      }.bind(this))
      .catch(function(reason) {
        console.error(reason);
        this.message = 'createTempPackageDirectoryFailure';
        this.trigger(this);
      }.bind(this));

    /*saveExportDatabase
     .then(function() {
     console.log('Export DB File Saved');

     // Iterate through each Source Object and copy the file from its Source Path into the temp directory
     this.copySourceFiles(this.getLokiSourceObjects(presentationObject.packageName), presentationObject, exportFileAdapter.tempExportDirectory)
     .then(function() {
     console.log('Source Files Copied');

     // Zip temporary directory
     zipTempDirectory
     .then(function() {
     console.log('Folder Zipped');

     // Encrypt zip file
     this.encryptPackage(presentationObject)
     .then(function() {
     console.log('Package Encrypted');

     // Delete temporary directory and zip file
     this.deleteTempDirectory(exportFileAdapter.tempExportDirectory)
     .then(function() {
     console.log('Temp directory removed');

     this.deleteZipFile(exportFileAdapter.tempExportDirectory + '.zip')
     .then(function() {
     console.log('Zip File removed');

     this.message = 'exportSuccess';
     this.trigger(this);
     }.bind(this))
     .catch(function(reason) {
     console.error(reason);
     this.message = 'removeZipFileFailure';
     this.trigger(this);
     }.bind(this));
     }.bind(this))
     .catch(function(reason) {
     console.log(this);
     console.error(reason);
     this.message = 'removeDirectoryFailure';
     this.trigger(this);
     }.bind(this));
     }.bind(this))
     .catch(function(reason) {
     console.error(reason);
     this.message = 'encryptionFailure';
     this.trigger(this);
     }.bind(this));
     }.bind(this))
     .catch(function(reason) {
     console.error(reason);
     this.message = 'zipDirectoryFailure';
     this.trigger(this);
     }.bind(this));
     }.bind(this))
     .catch(function(reason) {
     console.error(reason);
     this.message = 'sourceFileCopyFailure';
     this.trigger(this);
     }.bind(this));
     }.bind(this))
     .catch(
     function(reason) {
     console.error(reason);
     this.message = 'dbCopyFailure';
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

      // Extract Zip
      extract(zipPath, {dir: importFileAdapter.tempPackageDirectory}, function (err) {

        if (err) {
          reject('Error extracting Zip file: ' + err);
        } else {
          resolve();
        }
      });
    }.bind(this));
  },

  // Get an array of loki Source objects that we can use to copy files across
  getLokiSourceObjects: function(presentationName) {

    var sourceObjects;

    // ToDO: In unlikely case of no source collection, don't need to copy source files
    if (!dataSourceStore.dataSource.getCollection(config.SourcesCollection.name)) {

    }

    // If a filter has been applied, only get selected source records otherwise get all
    if (dataSourceStore.dataSource.getCollection(config.SourcesCollection.name).chain(presentationName)) {
      sourceObjects = dataSourceStore.dataSource.getCollection(config.SourcesCollection.name).chain(presentationName).data();
    } else {
      sourceObjects = dataSourceStore.dataSource.getCollection(config.SourcesCollection.name).data;
    }

    return sourceObjects;
  },

  // Iterate through each Source Object and copy the file from its Source Path into the temp directory
  copySourceFiles: function(sourceFilesArray, presentationObject, tempExportDirectory) {

    return new Promise(function (resolve, reject) {

      var sourceFilePath = config.paths.sourcePath;

      // Return a new Promise for every file to be copied
      var copyFile = function (sourceFile) {

        return new Promise(function(resolve, reject) {

          // Copy each source file to the temp directory
          fsExtra.copy(sourceFilePath + '/' + sourceFile['Linked File'], tempExportDirectory + '/' + sourceFile['Linked File'], function (err) {

            if (err) {
              console.log(sourceFile['Linked File'] + ' failed');
              reject(err);
            } else {
              console.log(sourceFile['Linked File'] + ' copied');
              resolve();
            }
          });
        });
      };

      // run the function over all items.
      var arrayOfPromises = sourceFilesArray.map(copyFile);

      // Resolve or reject Promise when all Promises have been evaluated
      Promise.all(arrayOfPromises).then(function() {
        console.log('All source files copied');
        resolve();
      })
        .catch(function(err) {
          reject(Error(err));
        });
    });
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

  // Delete the zip file
  deleteZipFile: function(zipPath) {

    return new Promise(function (resolve, reject) {

      fsExtra.remove(zipPath, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  }
});
