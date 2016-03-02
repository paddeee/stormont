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

  // Called on Store initialisation
  init: function() {

    this.selectedRecords = {};

    // Register dataSourceStores's changes
    this.listenTo(filterStateStore, this.filterStateChanged);

    // Create a debounced function so as this function will be called whenever any checkbox updates so need to limit it
    // for performance reasons
    this.debouncedCreateSelectedCollections = _.debounce(this.createSelectedCollections, 150);
  },

  // When filter state is changed we need to update the GeoJSON object
  filterStateChanged: function(filterStateStore) {

    if (filterStateStore.message.type !== 'queryBuilderChanged') {

      if (this.debouncedCreateSelectedCollections) {
        this.debouncedCreateSelectedCollections();
      }
    }
  },

  // Create a ResultSet on each store's userFilteredCollection
  createSelectedCollections: function() {

    var sortByField;

    // Get name of Field with a filter type of 'gte' to use as the sort field for Events
    config.EventsCollection.fields.forEach(function(filter) {
      if (filter.filter === 'gte') {
        sortByField = filter.name;
      }
    }.bind(this));

    this.selectedRecords[config.EventsCollection.name] = eventsStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    }).simplesort(sortByField);

    this.selectedRecords[config.PlacesCollection.name] = placesStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    });

    this.selectedRecords[config.PeopleCollection.name] = peopleStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    });

    this.selectedRecords[config.SourcesCollection.name] = sourcesStore.userFilteredCollection.copy().find({
      'showRecord': {
        '$eq': true
      }
    });

    this.trigger(this);
  }
});
