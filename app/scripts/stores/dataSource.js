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
        this.trigger(this.dataSource);

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
    this.trigger(this.dataSource);
  },

  // Add meta information, transform information and save loki db
  savePresentation: function (presentationObject) {

    var presentationName = presentationObject.presentationName;
    var createdDate = new Date();

    if (this.collectionExists(presentationName)) {
      console.log('collection exists');
    } else {

      this.manageCollectionTransformNames(presentationName);

      // Create Presentation meta info such as user and date created
      this.addSavedPresentationMetaData(presentationObject, createdDate);

      // Save database
      this.dataSource.saveDatabase(function() {
        console.log('Database Saved');
      });
      console.log(this.dataSource.collections);
    }
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
  manageCollectionTransformNames: function(presentationName) {

    this.dataSource.collections.forEach(function(collection) {

      // Check for the old property name to avoid a ReferenceError in strict mode.
      if (collection.transforms.hasOwnProperty('ViewingFilter')) {
        collection.transforms[presentationName] = collection.transforms['ViewingFilter'];
        delete collection.transforms['ViewingFilter'];
      }
    });
  },

  // Create a meta object and add to presentations collection of loki db
  addSavedPresentationMetaData: function (presentationObject, createdDate) {

    var presentationInfo = {};
    var presentationsCollection = this.dataSource.getCollection('Presentations');

    if (!presentationsCollection) {
      presentationsCollection = this.dataSource.addCollection('Presentations');
    }

    presentationInfo.presentationName = presentationObject.presentationName;
    presentationInfo.userName = presentationObject.userName;
    presentationInfo.notes = presentationObject.notes;
    presentationInfo.createdDate = createdDate;

    presentationsCollection.insert(presentationInfo);
  }

});
