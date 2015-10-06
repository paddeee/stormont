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
  savePresentation: function (userName) {

    var createdDate = new Date();

    // Create Presentation meta info such as user and date created
    this.addSavedPresentationMetaData(userName, createdDate);
    console.log(this.dataSource);


    // Save database
    this.dataSource.saveDatabase(function() {
      console.log('Database Saved');
    });
  },

  // Create a meta object and add to presentations collection of loki db
  addSavedPresentationMetaData: function (userName, createdDate) {

    var metaInfo = {};
    var presentations = this.dataSource.addCollection('Presentations');

    metaInfo.userName = userName;
    metaInfo.createdDate = createdDate;

    presentations.insert(metaInfo);
  }

});
