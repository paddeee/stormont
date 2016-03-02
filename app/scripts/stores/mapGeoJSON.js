'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var selectedRecordsStore = require('../stores/selectedRecords.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: config.MapGeoJSONCollection,

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(selectedRecordsStore, this.createGeoJSON);
  },

  // Create a GeoJSON Object that can be used by the Map and Timeline to visualise data
  createGeoJSON: function() {

    // Create an empty GeoJSON object
    var geoJSONObject = {
      type: Object,
        value: {
        'type': 'FeatureCollection',
        'features': []
      }
    };

    // Assign selected events from each store
    var selectedEvents = selectedRecordsStore.selectedRecords[config.EventsCollection.name].data();
    var selectedPlaces = selectedRecordsStore.selectedRecords[config.PlacesCollection.name].data();
    var selectedPeople = selectedRecordsStore.selectedRecords[config.PeopleCollection.name].data();
    var selectedSources = selectedRecordsStore.selectedRecords[config.SourcesCollection.name].data();


  }
});
