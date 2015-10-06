'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var filterTransform = require('../config/filterTransforms.js');
var filterStateStore = require('../stores/filterState.js');
var usersStore = require('../stores/users.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: 'Events',

  // Data storage for all collections
  dataSource: null,

  transformName: 'ImportFilter',

  // User object
  user: null,

  // Default state object on application load
  filterTransform: null,

  // The filtered places object
  filteredEvents: null,

  // The Loki collection transform array
  collectionTransform: [],

  // Called on Store initialistion
  init: function() {

    // Set filterTransform property on the object from the required config data
    this.filterTransform = filterTransform;

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    // Register usersStores's changes
    this.listenTo(usersStore, this.userChanged);

    // Register filterStateStore's changes
    this.listenTo(filterStateStore, this.filterStateChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function(dataSource) {

    this.dataSource = dataSource;

    // Call when the source data is updated
    this.filterStateChanged(this.filterTransform);
  },

  // Set the user Object
  userChanged: function(user) {
    this.user = user;
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformObject) {

    if (!this.dataSource) {
      return;
    }

    var collectionTransformObject = filterTransformObject.Events;
    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // If the filters have been changed while creating or editing a package set the transform name
    if (filterTransformObject.creatingPackage && this.user) {
      this.setTransformName();
    }

    // Add filter to the transform
    this.collectionTransform = [];
    this.collectionTransform.push(collectionTransformObject.filters);
    this.collectionTransform.push(collectionTransformObject.sorting);

    // Save the transform to the collection
    if (collectionToAddTransformTo.chain(this.transformName)) {
      collectionToAddTransformTo.setTransform(this.transformName, this.collectionTransform);
    } else {
      collectionToAddTransformTo.addTransform(this.transformName, this.collectionTransform);
    }

    this.filteredEvents = collectionToAddTransformTo.chain(this.transformName).data();

    // Send object out to all listeners
    this.trigger(this.filteredEvents);
  },

  // Set transform name base on username and previous number of saved presentations
  setTransformName: function() {
    this.transformName = this.user.userName + '~' + dataSourceStore.dataSource.getCollection('Presentations').maxId;
  }
});
