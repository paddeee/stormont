'use strict';

var Reflux = require('reflux');
var config = appMode === 'app' ? global.config : require('../config/config.js');
var SelectedRecordsActions = require('../actions/selectedRecords.js');
var eventsStore = require('../stores/events.js');
var placesStore = require('../stores/places.js');
var peopleStore = require('../stores/people.js');
var sourcesStore = require('../stores/source.js');
var importPackageStore = require('../stores/importPackage.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in SelectedRecordsActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [SelectedRecordsActions],

  // Called on Store initialisation
  init: function() {

    this.selectedRecords = {};

    // Register importPackageStore's changes
    this.listenTo(importPackageStore, this.importPackageChanged);

    // Create a debounced function so as this function will be called whenever any checkbox updates so need to limit it
    // for performance reasons
    this.debouncedCreateSelectedCollections = _.debounce(this.createSelectedCollections, 150);
  },

  // Add the images as blobs on the person's profile Object
  importPackageChanged: function (importPackageStore) {

    if (importPackageStore.message === 'importSuccess') {

      // Can set config object now
      config = global.config;
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

    this.message = {
      type: 'selectedRecordsUpdated'
    };

    // Update Profile View
    peopleStore.updateProfile();

    this.trigger(this);
  },

  // Time Line Event Selected
  timeLineEventSelected: function(eventObject) {

    this.activeEvent = eventObject.eventId;

    this.message = {
      type: 'timeLineSelectedRecord',
      displayType: eventObject.displayType
    };

    this.trigger(this);
  },

  // Set To One Event Changed
  setToOneChanged: function(eventObject) {

    this.activeEvent = eventObject.eventId;
    this.activePlace = eventObject.placeId;

    this.message = {
      type: 'setToOneChanged',
      displayType: eventObject.displayType
    };

    this.trigger(this);
  },

  // Set To Plus One Event Changed
  setToPlusOneChanged: function(eventObject) {

    this.activeEvent = eventObject.eventId;
    this.activePlace = eventObject.placeId;

    this.message = {
      type: 'setToPlusOneChanged',
      displayType: eventObject.displayType
    };

    this.trigger(this);
  },

  // Set To All Events
  setToAll: function(eventObject) {

    this.activeEvent = eventObject.eventId;
    this.activePlace = eventObject.placeId;

    this.message = {
      type: 'setToAll',
      displayType: eventObject.displayType
    };

    this.trigger(this);
  },

  // Map Event Selected
  mapEventSelected: function(eventObject) {

    this.activeEvent = eventObject.eventId;
    this.activePlace = eventObject.placeId;

    this.message = {
      type: 'mapSelectedRecord'
    };

    this.trigger(this);
  }
});
