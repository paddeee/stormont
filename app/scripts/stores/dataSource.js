'use strict';

var ldap =  global.packagedApp ? window.electronRequire('ldapjs') : null;
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

    // Check for LDAP
    this.LDAPExists()
     .then(function() {

      console.log('LDAP exists');

      this.dataSource = new loki('SITF.json', {
        adapter: fileAdapter
      });

      this.dataSource.loadDatabase({}, function() {

        // Send object out to all listeners when database loaded
        this.dataSource.message = {
          type: 'dataBaseLoaded'
        };

        this.trigger(this);

      }.bind(this));
    }.bind(this))
    .catch(function(error) {
      console.error(error);

      // ToDO: Check error and if timeout, start the app in offline mode


    }.bind(this));
  },

  // Can we establish an LDAP connection
  // ToDo: Need to manage LDAP connectivity checks from here. For now, just return true
  LDAPExists: function() {

    return new Promise(function (resolve, reject) {

      // In browser
      if (!ldap) {
        resolve();
      }

      var client = ldap.createClient({
        url: 'ldap://ldap.forumsys.com:389'
      });

      client.bind('cn=read-only-admin,dc=example,dc=com', 'password', function (err) {

        if (err) {
          client.unbind();
          reject('Error connecting to LDAP: ' + err);
        }

        // Can unbind connection now we know online is available
        client.unbind(function(err) {

          if (err) {
            reject('Problem unbinding from LDAP: ' + err);
          }

          resolve();
        });
      });
    });
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

      this.resetShowFilterProperties();

      this.manageCollectionTransformNames(presentationObject);

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
    var originalName = presentationObject.originalName;
    var createdDate = new Date();

    // Broadcast message if collection exists
    if (presentationName !== originalName && this.collectionExists(presentationName)) {

      this.message = 'collectionExists';
      this.trigger(this);

      // Try to save database
    } else {

      this.resetShowFilterProperties();

      this.updateCollectionTransformNames(presentationObject);

      // Create Presentation meta info such as user and date created
      this.savePresentationMetaData(presentationObject, createdDate, 'update');

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

      this.resetShowFilterProperties();

      this.deleteCollectionTransformNames(presentationObject);

      // Create Presentation meta info such as user and date created
      this.savePresentationMetaData(presentationObject, null, 'delete');

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

  // Remove showRecord and selectedByEvent properties from each record in each collection so records aren't saved
  // in collection data stores when creating a new package with these properties already set
  resetShowFilterProperties: function() {

    this.dataSource.collections.forEach(function (collection) {

      collection.data.forEach(function(object) {
        if (object.showRecord) {
          delete object.showRecord;
        }
        if (object.selectedByEvent) {
          delete object.selectedByEvent;
        }
      });
    });
  },

  // Iterate through all collections and set the transform names to the user created
  // presentation name
  manageCollectionTransformNames: function(presentationObject) {

    this.dataSource.collections.forEach(function (collection) {

      if (collection.transforms.hasOwnProperty('ViewingFilter')) {
        collection.transforms[presentationObject.presentationName] = collection.transforms.ViewingFilter;
        delete collection.transforms.ViewingFilter;

      // Could hit this condition if user is editing but haven't changed filters before saving.
      // If so, just use the transform from the package that's being created from.
      } else {
        if (collection.transforms[presentationObject.originalName]) {
          collection.transforms[presentationObject.presentationName] = collection.transforms[presentationObject.originalName];
        }
      }
    });
  },

  // Iterate through all collections and copy the original transform to one with a new object key.
  // Then, delete the transform names matching the user created presentation name
  updateCollectionTransformNames: function(presentationObject) {

    this.dataSource.collections.forEach(function (collection) {

      if (collection.transforms.hasOwnProperty('ViewingFilter')) {
        collection.transforms[presentationObject.presentationName] = collection.transforms.ViewingFilter;
        delete collection.transforms.ViewingFilter;

      } else {

        // Don't need to do anything if Presentation name hasn't changed
        if (collection.transforms[presentationObject.originalName] && presentationObject.presentationName !== presentationObject.originalName) {
          collection.transforms[presentationObject.presentationName] = collection.transforms[presentationObject.originalName];
          delete collection.transforms[presentationObject.originalName];
        }
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
