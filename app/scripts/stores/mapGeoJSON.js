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

    // Create/Update a GeoJSON collection in the database
    if (geoJSONCollection) {
      geoJSONCollection.clear();
    } else {
      dataSourceStore.dataSource.addCollection(config.MapGeoJSONCollection);
    }
  },

  // When filter state is changed we need to update the GeoJSON object
  filterStateChanged: function() {

    // Create an empty GeoJSON object
    /*var geoJSONObject = this.createGeoJSON();

    // Create Resultsets of selected records
    this.createSelectedCollections();

    console.log(this.selectedEvents.data());
    console.log(this.selectedPlaces.data());
    console.log(this.selectedPeople.data());
    console.log(this.selectedSources.data());*/
  },

  // Create a GeoJSON Object that can be used by the Map and Timeline to visualise data
  createGeoJSON: function() {

    return {
      type: Object,
        value: {
        'type': 'FeatureCollection',
        'features': []
      }
    };
  },

  // Create a ResultSet on each store's userFilteredCollection
  createSelectedCollections: function() {

    this.selectedEvents = eventsStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    }).simplesort('Begin Date and Time');

    this.selectedPlaces = placesStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    });

    this.selectedPeople = peopleStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    });

    this.selectedSources = sourcesStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    });
  }
});
