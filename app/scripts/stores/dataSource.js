'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var loki = require('lokijs');
var fileAdapter = require('../adapters/loki-file-adapter.js');
var DataSourceActions = require('../actions/dataSource.js');

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

    this.dataSource.loadDatabase({}, function() {
      console.log('Database Loaded');

      // Send object out to all listeners when database loaded
      this.dataSource.message = {
        type: 'dataBaseLoaded'
      };

      this.trigger(this);

    }.bind(this));
  },

  // Update and broadcast dataSource when a collection is imported
  collectionImported: function (dataSource) {

    this.dataSource = dataSource;

    // Send object out to all listeners when database loaded
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
      this.dataSource.saveDatabase(function() {
        this.message = 'presentationSaved';
        this.trigger(this);
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
      this.dataSource.saveDatabase(function () {
        this.message = 'presentationSaved';
        this.trigger(this);
      }.bind(this));
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
      presentationsCollection = this.dataSource.addCollection('Presentations');
    }

    if (action === 'save') {

      presentationInfo.presentationName = presentationObject.presentationName;
      presentationInfo.userName = presentationObject.userName;
      presentationInfo.notes = presentationObject.notes;
      presentationInfo.gateKeeperState = presentationObject.gateKeeperState;
      presentationInfo.authoriserState = presentationObject.authoriserState;
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
  }
});
