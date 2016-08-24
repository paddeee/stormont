'use strict';

var Reflux = require('reflux');
var config = global.config;
var loki = require('lokijs');
var exportFileAdapter = require('../adapters/loki-export-file-adapter.js');
var ExportActions = require('../actions/export.js');
var dataSourceStore = require('../stores/dataSource.js');
var eventsStore = require('../stores/events.js');
var placesStore = require('../stores/places.js');
var peopleStore = require('../stores/people.js');
var fsExtra = window.electronRequire('fs-extra');
var crypto = window.electronRequire('crypto');
var loggingStore = require('../stores/logging.js');
//var path = window.electronRequire('path');
//var usb = window.electronRequire('electron-usb');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ExportActions, using onKeyname (or keyname) as callbacks
  listenables: [ExportActions],

  packagePassword: '',

  // Check if YubiKey is inserted
  // ToDO: For now always saying true. Need to add npm yub to check for real
  onYubiKeyCheck: function() {

    var isYubiKeyInserted = true;

   // console.log(usb.getDeviceList());

    if (isYubiKeyInserted) {
      this.message = 'yubiKeyInserted';
    } else {
      this.message = 'noYubiKey';
    }

    this.trigger(this);
  },

  // Export a presentation to the filesystem
  onExportPresentation: function (presentationObject) {

    var exportDatabase = new loki('SITF.json', { adapter: exportFileAdapter });

    // Set property to be used by the loki export file adapter
    exportFileAdapter.tempExportDirectory = presentationObject.packageLocation + presentationObject.packageName;

    // Set the package password
    this.packagePassword = presentationObject.packagePassword;

    // Create a temporary directory for database file and related source files
    fsExtra.mkdirs(exportFileAdapter.tempExportDirectory + '/profiles', function(err) {

      if (err) {
        return console.error(err);
      } else {

        // Load the Export Database Collections into the DB
        // Then Update the collections depending on what the user has selected to export, filtered or selected
        // When the Export Database file is successfully saved, start the Export sequence
        exportDatabase.loadDatabase({}, function () {
          this.updateDataCollections(exportDatabase, presentationObject);
          this.commenceExportProcess(exportDatabase, presentationObject, this.packagePassword);
        }.bind(this));
      }
    }.bind(this));
  },

  // Start the chain of Promises that will handle the Export Process
  commenceExportProcess: function(exportDatabase, presentationObject) {

    var saveExportDatabase;

    // Create promise for saving the export Database
    saveExportDatabase = new Promise(function (resolve, reject) {

      // Save database
      exportDatabase.saveDatabase(function(response, error) {

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }.bind(this));
    });

    // Save the export Database as a file
    saveExportDatabase
    .then(function() {
      console.log('Export DB File Saved');

        // Encrypt the Database file
        this.encryptExportDatabase(exportDatabase, exportFileAdapter.tempExportDirectory)
          .then(function() {
            console.log('Export DB File Encrypted');

            // Delete the unecrypted Database file
            this.deleteUnencryptedDBFile(exportFileAdapter.tempExportDirectory + '/' + exportDatabase.filename)
              .then(function() {
                console.log('Unencrypted DB File Deleted');

                // Encrypt the Config file
                this.encryptConfigFile(exportFileAdapter.tempExportDirectory)
                  .then(function() {
                    console.log('Export Config File Encrypted');

                  // Copy Map Tiles
                  this.copyMapTiles(exportFileAdapter.tempExportDirectory)
                    .then(function() {
                      console.log('Map Tiles Copied');

                    // Iterate through each Source Object and copy the file from its Source Path into the temp directory
                    this.copySourceFiles(exportDatabase.getCollection(config.SourcesCollection.name).data, presentationObject, exportFileAdapter.tempExportDirectory)
                    .then(function() {
                      console.log('Source Files Copied');

                      // Iterate through each Person Object and copy the file from its Image Path into the temp directory
                      this.copyProfileImagesFiles(exportDatabase.getCollection(config.PeopleCollection.name).data, presentationObject, exportFileAdapter.tempExportDirectory, this.packagePassword)
                        .then(function() {
                          console.log('Profile Images Copied');

                          this.message = 'exportSuccess';
                          this.trigger(this);

                          this.logPackageExport(presentationObject.packageName);

                        }.bind(this))
                        .catch(function(error) {

                          this.logError('PROFILE IMAGES COPY FAILURE', error);

                          this.message = 'profileImagesCopyFailure';

                          // Delete temporary directory
                          this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

                          this.trigger(this);
                        }.bind(this));
                      }.bind(this))
                      .catch(function(error) {

                        this.logError('SOURCE FILE COPY FAILURE', error);

                        this.message = 'sourceFileCopyFailure';

                        // Delete temporary directory
                        this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

                        this.trigger(this);
                      }.bind(this));
                    }.bind(this))
                  .catch(function(error) {

                    this.logError('MAP TILES COPY FAILURE', error);

                    this.message = 'mapTilesCopyFailure';

                    // Delete temporary directory
                    this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

                    this.trigger(this);
                  }.bind(this));
                }.bind(this))
                .catch(function(error) {

                  this.logError('CONFIG FILE ENCRYPTION FAILURE', error);

                  this.message = 'configFileEncryptionError';

                  // Delete temporary directory
                  this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

                  this.trigger(this);
                }.bind(this));
              }.bind(this))
              .catch(function(error) {

                this.logError('DATABASE FILE DELETION FAILURE', error);

                this.message = 'dbFileDeletionError';

                // Delete temporary directory
                this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

                this.trigger(this);
              }.bind(this));
          }.bind(this))
      .catch(function(error) {

        this.logError('DATABASE FILE ENCRYPTION FAILURE', error);

        this.message = 'dbFileEncryptionError';

          // Delete temporary directory
          this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

        this.trigger(this);
      }.bind(this));
    }.bind(this))
    .catch(function(error) {

      this.logError('DATABASE FILE COPY FAILURE', error);

      this.message = 'dbCopyFailure';

      // Delete temporary directory
      this.deleteTempDirectory(exportFileAdapter.tempExportDirectory);

      this.trigger(this);
    }.bind(this));
  },

  // Base on whether the export has chosen filtered or selected records, set the collection data to the correct subset
  updateDataCollections: function(exportDatabase, presentationObject) {

    var exportEventData;
    var exportPlaceData;
    var exportPeopleData;
    var exportSourceData;
    var eventsCollection = exportDatabase.getCollection(config.EventsCollection.name);
    var placeCollection = exportDatabase.getCollection(config.PlacesCollection.name);
    var peopleCollection = exportDatabase.getCollection(config.PeopleCollection.name);
    var sourceCollection = exportDatabase.getCollection(config.SourcesCollection.name);
    var presentationsCollection = dataSourceStore.dataSource.getCollection('Presentations');
    var selectedPresentationObject = presentationsCollection.find({
      presentationName: presentationObject.packageName
    })[0];

      // If exporting filtered records, user the userFilteredCollection data
    if (presentationObject.filteredOrSelected === 'filtered') {
      exportEventData = eventsStore.userFilteredCollection.data();
      exportPlaceData = placesStore.userFilteredCollection.data();
      exportPeopleData = peopleStore.userFilteredCollection.data();

      // If exporting selected records, use the records stored in the presentations collection
    } else if (presentationObject.filteredOrSelected === 'selected') {
      exportEventData = selectedPresentationObject.selectedEvents;
      exportPlaceData = selectedPresentationObject.selectedPlaces;
      exportPeopleData = selectedPresentationObject.selectedPeople;
    }

    // Always export just selected sources
    exportSourceData = selectedPresentationObject.selectedSources;

    // Remove $loki properties from data so we can insert the documents afresh
    exportEventData = exportEventData.map(function(object) {

      var clonedObject = _.cloneDeep(object);

      delete clonedObject.$loki;
      return clonedObject;
    });

    exportPlaceData = exportPlaceData.map(function(object) {

      var clonedObject = _.cloneDeep(object);

      delete clonedObject.$loki;
      return clonedObject;
    });

    exportPeopleData = exportPeopleData.map(function(object) {

      var clonedObject = _.cloneDeep(object);

      delete clonedObject.$loki;
      return clonedObject;
    });

    exportSourceData = exportSourceData.map(function(object) {

      var clonedObject = _.cloneDeep(object);

      delete clonedObject.$loki;
      return clonedObject;
    });

    // Remove All records
    eventsCollection.removeDataOnly();
    placeCollection.removeDataOnly();
    peopleCollection.removeDataOnly();
    sourceCollection.removeDataOnly();

    // Add filtered or selected records
    eventsCollection.insert(exportEventData);
    placeCollection.insert(exportPlaceData);
    peopleCollection.insert(exportPeopleData);
    sourceCollection.insert(exportSourceData);
  },

  // Create promise for encrypting the export Config File
  encryptConfigFile: function(tempExportDirectory) {

    var packagePassword = this.packagePassword;

    return new Promise(function (resolve, reject) {

      // Input file
      var configReadStream = fsExtra.createReadStream(configPath);

      // Encrypt content
      var encrypt = crypto.createCipher('aes-256-ctr', packagePassword);

      // Write file
      var configWriteStream = fsExtra.createWriteStream(tempExportDirectory + '/appConfig.json');

      configReadStream.on('error', function(error) {
        reject(error);
        return;
      });

      configWriteStream.on('error', function(error) {
        reject(error);
        return;
      });

      // Start pipe
      configReadStream.on('open', function() {
        configReadStream.pipe(encrypt).pipe(configWriteStream);
      });

      // Start pipe
      configWriteStream.on('finish', function() {
        resolve();
      });
    });
  },

  // Create promise for encrypting the export Database
  encryptExportDatabase: function(exportDatabase, tempExportDirectory) {

    var packagePassword = this.packagePassword;

    return new Promise(function (resolve, reject) {

      // Input file
      var dbReadStream = fsExtra.createReadStream(tempExportDirectory + '/' + exportDatabase.filename);

      // Encrypt content
      var encrypt = crypto.createCipher('aes-256-ctr', packagePassword);

      // Write file
      var dbWriteStream = fsExtra.createWriteStream(tempExportDirectory + '/SITF.dat');

      dbReadStream.on('error', function(error) {
        reject(error);
        return;
      });

      dbWriteStream.on('error', function(error) {
        reject(error);
        return;
      });

      // Start pipe
      dbReadStream.on('open', function() {
        dbReadStream.pipe(encrypt).pipe(dbWriteStream);
      });

      // Start pipe
      dbWriteStream.on('finish', function() {
        resolve();
      });
    });
  },

  // Copy Map Tiles to Export Package
  copyMapTiles: function(tempExportDirectory) {

    return new Promise(function (resolve, reject) {

      var mapTilesPath = config.paths.mapTiles;
      var satelliteMapTilesPath = config.paths.satelliteMapTiles;

      // Copy map tiles
      fsExtra.copy(mapTilesPath, tempExportDirectory + '/mapTiles', function (error) {
        if (error) {
          reject(error);
        } else {

          // Copy satellite map tiles
          fsExtra.copy(satelliteMapTilesPath, tempExportDirectory + '/satelliteMapTiles', function (error) {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        }
      });
    });
  },

  // Iterate through each Source Object and copy the file from its Source Path into the temp directory
  copySourceFiles: function(sourceFilesArray, presentationObject, tempExportDirectory) {

    var packagePassword = this.packagePassword;

    return new Promise(function (resolve, reject) {

      var sourceFilePath = config.paths.sourcePath;

      // Return a new Promise for every file to be copied
      var copyFile = function (sourceFile) {

        return new Promise(function(resolve, reject) {

          // Create File if it does not exist
          fsExtra.ensureFile(tempExportDirectory + '/sourcefiles/' + sourceFile['Linked File'], function (error) {

            if (error) {

              if (error.code === 'EEXIST') {
                console.log(sourceFile['Linked File'] + ' exists');
                resolve();
              } else {
                console.log(sourceFile['Linked File'] + ' failed');
                reject(error);
              }
            } else {

              // Input file
              var sourceReadStream = fsExtra.createReadStream(sourceFilePath + '/' + sourceFile['Linked File']);

              // Encrypt content
              var encrypt = crypto.createCipher('aes-256-ctr', packagePassword);

              // Write file
              var sourceWriteStream = fsExtra.createWriteStream(tempExportDirectory + '/sourcefiles/' + sourceFile['Linked File']);

              sourceReadStream.pipe(encrypt).pipe(sourceWriteStream);

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
        resolve();
      })
        .catch(function(err) {
          reject(Error(err));
        });
    });
  },

  // Iterate through each Person Object and copy the file from its Image Path into the temp directory
  copyProfileImagesFiles: function(profileImagesArray, presentationObject, tempExportDirectory) {

    var packagePassword = this.packagePassword;

    return new Promise(function (resolve, reject) {

      var profileImagesPath = config.paths.profilesPath;

      // Copy the placeholder image
      (function copyPlaceholder() {

        fsExtra.copy(profileImagesPath + '/profile-placeholder.png', tempExportDirectory + '/profiles/profile-placeholder.png', function (error) {

          if (error) {
            console.log('Placeholder Image file failed');
            reject(error);
          } else {
            console.log('Placeholder Image file copied');
            resolve();
          }
        });
      })();

      // Return a new Promise for every file to be copied
      var copyFile = function (profile) {

        return new Promise(function(resolve, reject) {

          if (!profile.Photo) {
            resolve();
          } else {

            // File does not exist
            // Copy each source file to the temp directory
            fsExtra.ensureFile(tempExportDirectory + '/profiles/' + profile.Photo, function (error) {

              if (error) {

                if (error.code === 'EEXIST') {
                  console.log(profile.Photo + ' file exists');
                  resolve();
                } else {
                  console.log(profile.Photo + ' failed');
                  reject(error);
                }
              } else {

                // Input file
                var profileReadStream = fsExtra.createReadStream(profileImagesPath + '/' + profile.Photo);

                // Encrypt content
                var encrypt = crypto.createCipher('aes-256-ctr', packagePassword);

                // Write file
                var profileWriteStream = fsExtra.createWriteStream(tempExportDirectory + '/profiles/' + profile.Photo);

                profileReadStream.pipe(encrypt).pipe(profileWriteStream);

                console.log(profile.Photo + ' copied');

                resolve();
              }
            });
          }
        });
      };

      // run the function over all items.
      var arrayOfPromises = profileImagesArray.map(copyFile);

      // Resolve or reject Promise when all Promises have been evaluated
      Promise.all(arrayOfPromises).then(function() {
          console.log('All profile image files copied');
          resolve();
        })
        .catch(function(err) {
          reject(Error(err));
        });
    });
  },

  // Delete the unencrypted database file
  deleteUnencryptedDBFile: function(dbPath) {

    return new Promise(function (resolve, reject) {

      fsExtra.remove(dbPath, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  },

  // Log on package creation or update
  logPackageExport: function(presentationName) {

    var exportLogObject = {
      presentationName: presentationName
    };

    if (global.config) {
      loggingStore.packageExported(exportLogObject);
    }
  },

  // Log on package creation or update
  logError: function(errorType, errorMessage) {

    var errorObject = {
      type: errorType,
      message: errorMessage
    };

    if (appMode === 'app') {
      loggingStore.logError(errorObject);
    }
  },

  // Delete the temporary Directory
  deleteTempDirectory: function(tempExportDirectory) {

    return new Promise(function (resolve, reject) {

      fsExtra.remove(tempExportDirectory, function (err) {

        if (err) {
          reject(Error(err));
        } else {
          resolve();
        }
      }.bind(this));
    });
  }
});
