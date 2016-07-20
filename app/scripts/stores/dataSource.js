'use strict';

var Reflux = require('reflux');
var config = global.config ? global.config : require('../config/config.js');
var loki = require('lokijs');
var fileAdapter = require('../adapters/loki-file-adapter.js');
var DataSourceActions = require('../actions/dataSource.js');
var loggingStore = require('../stores/logging.js');
var lockFile = global.config ? window.electronRequire('lockfile') : null;

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [DataSourceActions],

  // The Loki db object
  dataSource: null,

  loadDatabase: function() {

    console.log('loadDatabase called');

    this.dataSource = new loki('SITF.json', {
      adapter: fileAdapter
    });

    this.dataSource.loadDatabase({}, function () {
      console.log('Database Loaded');

      // Enable the changes API
      this.enableChangesAPI();

      // Send object out to all listeners when database loaded
      this.dataSource.message = {
        type: 'dataBaseLoaded'
      };

      this.trigger(this);

    }.bind(this));
  },

  getLatestDatabase: function() {

    return new Promise(function (resolve) {

      console.log('getLatestDatabase called');

      this.latestDB = new loki('SITF.json', {
        adapter: fileAdapter
      });

      this.latestDB.loadDatabase({}, function () {
        console.log('Database Loaded');

        // Send object out to all listeners when database loaded
        this.latestDB.message = {
          type: 'dataBaseLoaded'
        };

        this.trigger(this);

        resolve();

      }.bind(this));
    }.bind(this));
  },

  // Update and broadcast dataSource when a collection is imported
  collectionImported: function (dataSource) {

    this.dataSource = dataSource;

    // Send object out to all listeners when collection imported
    this.trigger(this);
  },

  // Add meta information, transform information and save loki db
  savePresentation: function (presentationObject) {

    var presentationName = presentationObject.presentationName;
    var createdDate = new Date();

    // Broadcast message if collection exists
    if (this.collectionExists(presentationName)) {

     this.message = 'collectionExists';
     this.trigger(this);

    // Try to save database
    } else {

      this.manageCollectionTransformNames(presentationObject);

      // Create Presentation meta info such as user and date created
      this.createPresentationMetaData(presentationObject, createdDate, 'save');

      // Keep a record of all selected records
      this.updateSelectedRecords(presentationName);

      // Save database
      this.syncDatabase()
      .then(function() {

        this.dataSource.saveDatabase(function () {
          this.message = 'presentationSaved';
          this.trigger(this);

          this.logPackageSave('created', presentationName);

        }.bind(this));
        }.bind(this));
    }
  },

  // Add meta information, transform information and update loki db
  updatePresentation: function (presentationObject) {

    var presentationName = presentationObject.presentationName;
    var originalName = presentationObject.originalName;
    var createdDate = new Date();

    // Broadcast message if collection exists
    if (presentationName !== originalName && this.collectionExists(presentationName)) {

      this.message = 'collectionExists';
      this.trigger(this);

      // Try to save database
    } else {

      this.updateCollectionTransformNames(presentationObject);

      // Create Presentation meta info such as user and date created
      this.createPresentationMetaData(presentationObject, createdDate, 'update');

      // Keep a record of all selected records
      this.updateSelectedRecords(presentationName);

      // Save database
      this.syncDatabase()
      .then(function() {

        this.dataSource.saveDatabase(function () {
          this.message = 'presentationSaved';
          this.trigger(this);

          this.logPackageSave('updated', presentationName);

        }.bind(this));
      }.bind(this))
      .catch(function(error) {
        console.log(error);
      });
    }
  },

  // Delete Presentation, transform information and save loki db
  deletePresentation: function (presentationObject) {

    var presentationName = presentationObject.presentationName;

    // Broadcast message if collection exists
    if (this.collectionExists(presentationName)) {

      this.deleteCollectionTransformNames(presentationObject);

      // Create Presentation meta info such as user and date created
      this.createPresentationMetaData(presentationObject, null, 'delete');

      // Delete record from Queries Collection to keep everything tidy
      this.saveQueryBuilderData(presentationObject, 'delete');

      // Save database
      this.dataSource.saveDatabase(function() {
        this.message = 'presentationDeleted';
        this.trigger(this);
      }.bind(this));

    } else {
      console.error('Can\'t delete collection as doesn\'t exist in database');
    }
  },

  // Keep selected state of records in Presentations collection
  updateSelectedRecords: function(presentationName) {

    var selectedEvents = [];
    var selectedPlaces = [];
    var selectedPeople = [];
    var selectedSources = [];

    var presentationsCollection = this.dataSource.getCollection('Presentations');
    var presentationObject = presentationsCollection.find({
      presentationName: presentationName
    })[0];

    var eventData = this.dataSource.getCollection(config.EventsCollection.name).data;
    var placeData = this.dataSource.getCollection(config.PlacesCollection.name).data;
    var peopleData = this.dataSource.getCollection(config.PeopleCollection.name).data;
    var sourceData = this.dataSource.getCollection(config.SourcesCollection.name).data;

    // Push selected ids onto arrays
    eventData.forEach(function(object) {
      if (object.showRecord === true) {
        selectedEvents.push(_.cloneDeep(object));
      }
    });

    placeData.forEach(function(object) {
      if (object.showRecord === true) {
        selectedPlaces.push(_.cloneDeep(object));
      }
    });

    peopleData.forEach(function(object) {
      if (object.showRecord === true) {
        selectedPeople.push(_.cloneDeep(object));
      }
    });

    sourceData.forEach(function(object) {
      if (object.showRecord === true) {
        selectedSources.push(_.cloneDeep(object));
      }
    });

    // Assign selectedRecord Arrays to properties on Presentations Collection
    presentationObject.selectedEvents = selectedEvents;
    presentationObject.selectedPlaces = selectedPlaces;
    presentationObject.selectedPeople = selectedPeople;
    presentationObject.selectedSources = selectedSources;

    // Update presentations collection presentation object
    presentationsCollection.update(presentationObject);
  },

  // Return true if presentationName exists in collection
  collectionExists: function(presentationName) {

    var presentationCollection = this.dataSource.getCollection('Presentations');

    if (presentationCollection) {
      if (presentationCollection.find({
          'presentationName' : presentationName
        }).length) {
        return true;
      }
    }
    return false;
  },

  // Iterate through all collections and set the transform names to the user created
  // presentation name
  manageCollectionTransformNames: function(presentationObject) {

    this.dataSource.collections.forEach(function (collection) {

      if (collection.transforms[presentationObject.originalName]) {
        collection.transforms[presentationObject.presentationName] = collection.transforms[presentationObject.originalName];
      }
    });
  },

  // Iterate through all collections and copy the original transform to one with a new object key.
  // Then, delete the transform names matching the user created presentation name
  updateCollectionTransformNames: function(presentationObject) {

    this.dataSource.collections.forEach(function (collection) {

      // Don't need to do anything if Presentation name hasn't changed
      if (collection.transforms[presentationObject.originalName] && presentationObject.presentationName !== presentationObject.originalName) {
        collection.transforms[presentationObject.presentationName] = collection.transforms[presentationObject.originalName];
        delete collection.transforms[presentationObject.originalName];
      }
    });
  },

  // Iterate through all collections and delete the transform names matching the user created
  // presentation name
  deleteCollectionTransformNames: function(presentationObject) {

    this.dataSource.collections.forEach(function (collection) {
      delete collection.transforms[presentationObject.presentationName];
    });
  },

  // Create a meta object and add to presentations collection of loki db
  createPresentationMetaData: function (presentationObject, createdDate, action) {

    var presentationInfo = {};
    var presentationsCollection = this.dataSource.getCollection('Presentations');

    if (!presentationsCollection) {
      presentationsCollection = this.dataSource.addCollection('Presentations', { disableChangesApi: false });
    }

    if (action === 'save') {

      presentationInfo.presentationName = presentationObject.presentationName;
      presentationInfo.userName = presentationObject.userName;
      presentationInfo.notes = presentationObject.notes;
      presentationInfo.gateKeeperState = presentationObject.gateKeeperState;
      presentationInfo.authoriserState = presentationObject.authoriserState;
      presentationInfo.hideExportButton = presentationObject.hideExportButton;
      presentationInfo.createdDate = createdDate;
      presentationInfo.unapprovedSource = presentationObject.unapprovedSource;

      presentationsCollection.insert(presentationInfo);
    } else if (action === 'update') {
      presentationsCollection.update(presentationObject);
    } else if (action === 'delete') {
      presentationsCollection.remove(presentationObject);
    }
  },

  // Create a meta object and add to presentations collection of loki db
  saveQueryBuilderData: function (presentationObject, action) {

    var queryBuilderCollection = this.dataSource.getCollection('Queries');

    if (action === 'delete') {
      queryBuilderCollection.removeWhere({
        packageName: presentationObject.presentationName
      });
    }
  },

  // Log on package creation or update
  logPackageSave: function(type, presentationName) {

    var saveLogObject = {
      presentationName: presentationName
    };

    if (global.config) {

      if (type === 'created') {
        loggingStore.packageCreated(saveLogObject);
      } else if (type === 'updated') {
        loggingStore.packageUpdated(saveLogObject);
      }
    }
  },

  // Enable the changes API when the QueryBuilder and Presentations database collections are loaded in
  enableChangesAPI: function() {

    this.dataSource.collections.forEach(function(collection) {

      if (collection.name === config.QueriesCollection || collection.name === config.PresentationsCollection) {
        collection.setChangesApi(true);
      }
    });
  },

  // Before saving database, need to:
  // Lock database file
  // Load latest database into a temporary variable
  // Sync the two databases into this.dataSource using the loki.js Changes API
  // Unlock the database file
  syncDatabase: function(syncType) {

    return new Promise(function (resolve) {

      console.time('syncDatabase');

      /*if (!global.config) {
        resolve();
      } else {*/

        // Lock DB file
        /*this.lockDBFile('lock')
        .then(function () {*/

        // Load Database into latestDB variable
        this.getLatestDatabase()
          .then(function() {

            this.updateDBWithChanges(syncType)
              .then(function() {

                console.timeEnd('syncDatabase');

                // Finished with sync so clear changes
                this.dataSource.clearChanges();git commit -am
                resolve();
              }.bind(this));
          }.bind(this));
          /*}.bind(this))
        .catch(function (error) {
          reject(error);
        });
      }*/
    }.bind(this));
  },

  // Lock the database file
  lockDBFile: function(lockState) {

    return new Promise(function (resolve, reject) {

      var dbPath = config.paths.dbPath + '/SITF.json';

      if (lockState === 'lock') {
        lockFile.lock(dbPath, {}, function (error) {
          console.log(dbPath);

          if (error) {
            console.log('lockfile error');
            reject(error);
          } else {
            resolve();
          }
        });
      }
    });
  },

  // Update the latest db with the changes
  updateDBWithChanges: function(syncType) {

    return new Promise(function (resolve) {

      var queryBuilderCollection = this.dataSource.getCollection('Queries');
      var presentationsCollection = this.dataSource.getCollection('Presentations');
      var queryBuilderProcessedChanges;
      var presentationsProcessedChanges;

      // If importing data QueryBuilder and Presentations COllections may not exist so don't bother with syncing
      if (syncType === 'import') {
        this.dataSource = this.latestDB;
        resolve();
      } else {

        queryBuilderProcessedChanges = this.processCollectionChanges(queryBuilderCollection.changes);
        presentationsProcessedChanges = this.processCollectionChanges(presentationsCollection.changes);

        console.log(queryBuilderProcessedChanges);
        console.log(presentationsProcessedChanges);

        queryBuilderProcessedChanges.forEach(this.syncChange);
        presentationsProcessedChanges.forEach(this.syncChange);

        this.dataSource = this.latestDB;

        resolve();
      }

    }.bind(this));
  },

  // Changes batch changes to each object in order. E.g. if an object is inserted and then deleted, we don't need to sync that change.
  processCollectionChanges: function(changes) {

    var processedChanges = [];

    changes.forEach(function(changeObject) {

      var firstObject;
      var lastObject;

      // If change is an insert, find the last change for that id. Push if it is an update (and change operator to 'I'). Ignore if a delete.
      if (changeObject.operation === 'I') {

        lastObject = _.findLast(changes, function(changeObjectToCompare) {
          return changeObject.$loki === changeObjectToCompare.$loki;
        });

        if (lastObject && lastObject.operation === 'U') {
          lastObject.operation = 'I';
        }

        delete lastObject.obj.$loki;
        processedChanges.push(lastObject);
      }

      // If change is an update, find the last change for that id. Push if it is an update. Ignore if a delete.
      else if (changeObject.operation === 'U') {

        lastObject = _.findLast(changes, function(changeObjectToCompare) {
          return changeObject.$loki === changeObjectToCompare.$loki;
        });

        if (lastObject && lastObject.operation === 'U') {
          processedChanges.push(lastObject);
        }
      }

      // If change is a delete, find the first change for that id. Push if there isn't one or if an update.
      // Ignore if it was an insert.
      else if (changeObject.operation === 'D') {

        firstObject = _.find(changes, function(changeObjectToCompare) {
          return changeObject.$loki === changeObjectToCompare.$loki;
        });

        if (!firstObject && firstObject.operation !== 'I') {
          processedChanges.push(firstObject);
        }
      }
    });

    return _.uniq(processedChanges);
  },

  // Update the latest db with the changes
  syncChange: function(changeObject) {

    switch (changeObject.operation) {
      case 'I':
        this.latestDB.getCollection(changeObject.name).insert(changeObject.obj);
        break;
      case 'U':
        this.latestDB.getCollection(changeObject.name).update(changeObject.obj);
        break;
      case 'D':
        this.latestDB.getCollection(changeObject.name).delete(changeObject.obj);
        break;
    }
  }
});
