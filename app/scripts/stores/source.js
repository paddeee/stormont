'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var filterTransform = require('../config/filterTransforms.js');
var filterStateStore = require('../stores/filterState.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: 'Source',

  // Data storage for all collections
  dataSource: null,

  // The Loki collection transform array
  collectionTransform: [],

  // Called on Store initialistion
  init: function() {

    // Set filterTransform property on the object from the required config data
    this.filterTransform = filterTransform;

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    // Register filterStateStore's changes
    this.listenTo(filterStateStore, this.filterStateChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSourceStore) {

    this.dataSource = dataSourceStore.dataSource;

    // Call when the source data is updated
    this.filterStateChanged(this.filterTransform);
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformBroadcast) {

    // If the incoming parameter is a string, we are setting the transform from a pre-existing one
    if (typeof filterTransformBroadcast === 'string') {
      this.updateFilterTransform(filterTransformBroadcast);
    } else {
      this.createFilterTransform(filterTransformBroadcast);
    }
  },

  // Create a transform from the passed in object and save it on the collection
  createFilterTransform: function(filterTransformObject) {

    if (!this.dataSource) {
      return;
    }

    var collectionTransformObject = filterTransformObject[this.collectionName];
    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Add filter to the transform
    this.collectionTransform = [];
    this.collectionTransform.push(collectionTransformObject.filters);
    this.collectionTransform.push(collectionTransformObject.sorting);

    // Save the transform to the collection
    if (collectionToAddTransformTo.chain(filterTransformObject.transformName)) {
      collectionToAddTransformTo.setTransform(filterTransformObject.transformName, this.collectionTransform);
    } else {
      collectionToAddTransformTo.addTransform(filterTransformObject.transformName, this.collectionTransform);
    }

    this.filteredCollection = collectionToAddTransformTo.chain(filterTransformObject.transformName).data();

    // Send object out to all listeners
    this.trigger(this.filteredCollection);
  },

  // Retrieve a transform from the db using a transform name
  updateFilterTransform: function(transformName) {

    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Update this store's filterTransform so the filters will be updated when a presentation changes
    this.filterTransform[this.collectionName].filters = this.dataSource.getCollection(this.collectionName).transforms[transformName][0];

    // Update the collection resulting from the transform
    this.filteredCollection = collectionToAddTransformTo.chain(transformName).data();

    // Send collection object out to all listeners
    this.trigger(this.filteredCollection);
  }
});
