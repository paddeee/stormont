'use strict';

var Reflux = require('reflux');
var ExportActions = require('../actions/export.js');
var dataSourceStore = require('../stores/dataSource.js');
var fs = window.electronRequire('fs-extra');
var zipFolder = window.electronRequire('zip-folder');
var encryptor = window.electronRequire('file-encryptor');
//var crypto = window.electronRequire('crypto');
//var usbDetect = window.electronRequire('usb-detection');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ImportActions, using onKeyname (or keyname) as callbacks
  listenables: [ExportActions],

  packagePassword: '',

  // Check if YubiKey is inserted
  // ToDO: For now always saying true. Need to add npm yub to check for real
  onYubiKeyCheck: function() {

    var isYubiKeyInserted = true;

    /*usbDetect.
      find().
      then(function(devices) {
        console.log(devices);
      }).
      catch(function(err) {
        console.log(err);
      });*/

    if (isYubiKeyInserted) {
      this.message = 'yubiKeyInserted';
    } else {
      this.message = 'noYubiKey';
    }

    this.trigger(this);
  },

  // Export a presentation to the filesystem
  onExportPresentation: function (presentationObject) {

    var tempExportDirectory = presentationObject.packageLocation + presentationObject.packageName;
    var dbName = '/SITF.json';
    var dbFilePath = window.appConfig.paths.dbPath + dbName;

    // Create promise for copying the Database file
    var copyDBFile = new Promise(function (resolve, reject) {

      fs.copy(dbFilePath, tempExportDirectory + dbName, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Create promise for zipping the Temporary Directory
    var zipTempDirectory = new Promise(function (resolve, reject) {

      // Add artificial timeout to make sure the directory is ready with all its contents
      setTimeout(function() {
        zipFolder(tempExportDirectory, tempExportDirectory + '.zip', function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }, 100);
    });

    // Set the package password
    this.packagePassword = presentationObject.packagePassword;

    // Create a temporary directory for database file and related source files
    fs.mkdirs(tempExportDirectory, function(err) {

      if (err) {
        return console.error(err);
      }
    });

    // ToDo: Remove all other package transforms
    this.removeOtherTransformFilters();

    // Commence Export Process
    copyDBFile
    .then(function() {
      console.log('DB File Copied');

      // Iterate through each Source Object and copy the file from its Source Path into the temp directory
      this.copySourceFiles(this.getLokiSourceObjects(presentationObject.packageName), presentationObject, tempExportDirectory)
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
            this.deleteTempDirectory(tempExportDirectory)
            .then(function() {
              console.log('Temp directory removed');

              this.deleteZipFile(tempExportDirectory + '.zip')
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
    }.bind(this));
  },

  // Encrypt a zip file using aes-256 and the package password
  encryptPackage: function (presentationObject) {

    return new Promise(function (resolve, reject) {

      var packageName = presentationObject.packageName;
      var tempDirectory = presentationObject.packageLocation;
      var zipPath = tempDirectory + packageName + '.zip';
      var options = {
        algorithm: 'aes256'
      };

      // Encrypt file
      encryptor.encryptFile(zipPath, tempDirectory + packageName + '.dat', this.packagePassword, options, function(err) {

        if (err) {
          reject('Error encrypting Zip file: ' + err);
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
    if (!dataSourceStore.dataSource.getCollection('Source')) {

    }

    // If a filter has been applied, only get selected source records otherwise get all
    if (dataSourceStore.dataSource.getCollection('Source').chain(presentationName)) {
      sourceObjects = dataSourceStore.dataSource.getCollection('Source').chain(presentationName).data();
    } else {
      sourceObjects = dataSourceStore.dataSource.getCollection('Source').data;
    }

    return sourceObjects;
  },

  // ToDo: Remove other transform filters
  removeOtherTransformFilters: function() {
    console.log('ToDo: Remove Other transform package names');
  },

  // Iterate through each Source Object and copy the file from its Source Path into the temp directory
  copySourceFiles: function(sourceFilesArray, presentationObject, tempExportDirectory) {

    return new Promise(function (resolve, reject) {

      var sourceFilePath = window.appConfig.paths.sourcePath;

      // Return a new Promise for every file to be copied
      var copyFile = function (sourceFile) { // sample async action

        return new Promise(function(resolve, reject) {

          // Copy each source file to the temp directory
          fs.copy(sourceFilePath + '/' + sourceFile.Src, tempExportDirectory + '/' + sourceFile.Src, function (err) {

            if (err) {
              reject(err);
            } else {
              console.log(sourceFile.Src + ' copied');
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

  // Delete the temporary Directory
  deleteTempDirectory: function(tempExportDirectory) {

    return new Promise(function (resolve, reject) {

      fs.remove(tempExportDirectory, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  },

  // Delete the zip file
  deleteZipFile: function(zipPath) {

    return new Promise(function (resolve, reject) {

      fs.remove(zipPath, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  }
});
