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
  }
});
