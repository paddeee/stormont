'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var fileAdapter = require('../adapters/loki-file-adapter.js');
var DataSourceActions = require('../actions/dataSource.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [DataSourceActions],

  // The Loki db object
  dataSource: null,

  // Set the dataSource Object based on the availability of LDAP
  checkForLDAP: function () {

    if (this.LDAPExists()) {

      this.dataSource = new loki('farrell.json', {
        adapter: fileAdapter
      });

      this.dataSource.loadDatabase({}, function() {

        // Send object out to all listeners when database loaded
        this.trigger(this);

      }.bind(this));
    }
  },

  // Can we establish an LDAP connection
  // ToDo: Need to manage LDAP connectivity checks from here. For now, just return true
  LDAPExists: function() {
    return true;
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

      this.manageCollectionTransformNames(presentationObject, presentationName);

      // Create Presentation meta info such as user and date created
      this.savePresentationMetaData(presentationObject, createdDate, 'save');

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
    var createdDate = new Date();

    this.manageCollectionTransformNames(presentationObject, presentationName);

    // Create Presentation meta info such as user and date created
    this.savePresentationMetaData(presentationObject, createdDate, 'update');

    // Save database
    this.dataSource.saveDatabase(function() {
      this.message = 'presentationSaved';
      this.trigger(this);
    }.bind(this));
  },

  // Return true if presentationName exists in collection
  collectionExists: function(presentationName) {

    var presentationCollection = this.dataSource.getCollection('Presentations');

    if (presentationCollection) {
      if (presentationCollection.find({'presentationName' : presentationName}).length) {
        return true;
      }
    }
    return false;
  },

  // Iterate through all collections and set the transform names to the user created
  // presentation name
  manageCollectionTransformNames: function(presentationObject) {

    var state = presentationObject.presentationState;

    this.dataSource.collections.forEach(function (collection) {

      if (collection.transforms.hasOwnProperty('ViewingFilter')) {
        collection.transforms[presentationObject.presentationName] = collection.transforms['ViewingFilter'];
        delete collection.transforms['ViewingFilter'];

      // Could hit this condition if user is editing but haven't changed filters before saving.
      // If so, just use the transform from the package that's being created from.
      } else {
        collection.transforms[presentationObject.presentationName] = collection.transforms[presentationObject.originalName];
      }
    });
  },

  // Create a meta object and add to presentations collection of loki db
  savePresentationMetaData: function (presentationObject, createdDate, action) {

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

      presentationsCollection.insert(presentationInfo);
    } else if (action === 'update') {
      presentationsCollection.update(presentationObject);
    }
  }

});
