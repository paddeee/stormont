'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var dataSourceStore = require('../stores/dataSource.js');
var filterStateStore = require('../stores/filterState.js');
var eventsStore = require('../stores/events.js');
var placesStore = require('../stores/places.js');
var peopleStore = require('../stores/people.js');
var sourcesStore = require('../stores/source.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: config.MapGeoJSONCollection,

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    // Register dataSourceStores's changes
    this.listenTo(filterStateStore, this.filterStateChanged);
  },

  // When filter state is changed we need to update the GeoJSON object
  dataSourceChanged: function() {

    var geoJSONCollection = dataSourceStore.dataSource.getCollection(config.MapGeoJSONCollection);

    // Create/Update a collection in the database
    if (geoJSONCollection) {
      geoJSONCollection.clear();
    } else {
      dataSourceStore.dataSource.addCollection(config.MapGeoJSONCollection);
    }
  },

  // When filter state is changed we need to update the GeoJSON object
  filterStateChanged: function() {

    this.updateGeoJSON();
  },

  // Listener to changes on Presentations Store
  updateGeoJSON: function() {

    console.log(dataSourceStore.dataSource);
    //console.log(this.isDynamicViewSet(eventsStore.filteredCollection, 'MapGeoJSON'));
  },

  // Set the GEOJSON Dynamic View already exists
  setGeoJSONDynamicView: function() {

  },

  // Retrieve a transform from the db using a transform name
  updateFilterTransform: function(transformName) {

    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Update this store's filterTransform so the filters will be updated when a presentation changes
    if (this.dataSource.getCollection(this.collectionName).transforms[transformName][0]) {
      this.filterTransform[this.collectionName].filters = this.dataSource.getCollection(this.collectionName).transforms[transformName][0];
    }

    // Update the collection resulting from the transform
    this.userFilteredCollection = collectionToAddTransformTo.chain(transformName).data();

    // Send collection object out to all listeners
    this.trigger(this.userFilteredCollection);
  },

  // Reset a transform on this collection
  resetFilterTransform: function() {

    var collectionToAddTransformTo;
    var transformName = 'DefaultFilter';

    if (!this.dataSource) {
      return;
    }

    collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Update this store's filterTransform so the filters will be updated when a presentation changes
    this.filterTransform[this.collectionName].filters = this.dataSource.getCollection(this.collectionName).transforms[transformName][0];

    // Update the collection resulting from the transform
    this.userFilteredCollection = collectionToAddTransformTo.chain(transformName).data();

    // Send collection object out to all listeners
    this.trigger(this.userFilteredCollection);
    this.trigger(this.userFilteredCollection);
  },

  //
  setDefaultFilter: function() {

    var collectionToAddTransformTo;

    if (!this.dataSource) {
      return;
    }

    collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    this.collectionTransform = [];
    this.collectionTransform.push(filterTransform[this.collectionName].filters);
    this.collectionTransform.push(filterTransform[this.collectionName].sorting);

    collectionToAddTransformTo.setTransform('DefaultFilter', this.collectionTransform);
  }
});
