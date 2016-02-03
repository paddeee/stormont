'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var filterTransforms = require('../config/filterTransforms.js');
var FilterStateActions = require('../actions/filterState.js');
var dataSourceStore = require('../stores/dataSource.js');
var eventsStore = require('../stores/events.js');
var placesStore = require('../stores/places.js');
var peopleStore = require('../stores/people.js');
var sourcesStore = require('../stores/source.js');
var uniq = require('lodash/array/uniq');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in FilterStateActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  init: function() {
    this.transformName = 'ViewingFilter';

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function () {

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollections
    // method
    this.autoFilterCollections(false);
  },

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollections
    // method
    this.autoFilterCollections(true);
  },

  // Set simpleSort on our collectionTransform
  sortingChanged: function(sortingObject) {

    this.updateSortedData(sortingObject);

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollections
    // method
    this.autoFilterCollections(false);
  },

  // Update filtered data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateFilteredData: function(searchFilterObject) {

    switch (searchFilterObject.collectionName) {
      case config.EventsCollection:
        filterTransforms[config.EventsCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      case config.PlacesCollection:
        filterTransforms[config.PlacesCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      case config.PeopleCollection:
        filterTransforms[config.PeopleCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      case config.SourcesCollection:
        filterTransforms[config.SourcesCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      default:
        console.error('No collection Name');
    }
  },

  // Update sorted data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateSortedData: function(sortingObject) {

    switch (sortingObject.collectionName) {
      case config.EventsCollection:
        filterTransforms[config.EventsCollection].sorting = this.createSortingObject(sortingObject);
        break;
      case config.PlacesCollection:
        filterTransforms[config.PlacesCollection].sorting = this.createSortingObject(sortingObject);
        break;
      case config.PeopleCollection:
        filterTransforms[config.PeopleCollection].sorting = this.createSortingObject(sortingObject);
        break;
      case config.SourcesCollection:
        filterTransforms[config.SourcesCollection].sorting = this.createSortingObject(sortingObject);
        break;
      default:
        console.error('No collection Name');
    }
  },

  // Create a filter transform object from a filter Object
  createFilterObject: function(searchFilterObject) {

    var transform = {
      type: 'find',
      value: {
        $and: []
      }
    };

    searchFilterObject.fields.forEach(function (field) {

      var fieldObject = {};
      var queryObject = {};

      if (field.queryType !== 'regex') {
        queryObject[field.queryType] = field.value;
      } else {
        queryObject.$regex = [field.value, 'i'];
      }

      fieldObject[field.name] = queryObject;

      transform.value.$and.push(fieldObject);
    });

    return transform;
  },

  // Create a sorting transform object from a sorting Object
  createSortingObject: function(sortingObject) {

    var transform = {
      type: 'simplesort',
      property: sortingObject.fieldName,
      desc: sortingObject.desc
    };

    return transform;
  },

  // Triggered when a package is chosen to be viewed or edited
  packageSelected: function(presentationName) {

    // Call filterStateChanged on each data store
    eventsStore.filterStateChanged(presentationName);
    placesStore.filterStateChanged(presentationName);
    peopleStore.filterStateChanged(presentationName);
    sourcesStore.filterStateChanged(presentationName);
  },

  // Filter on datastore userFilteredCollections based on linkage rules between tables
  // Event Place field links to Places Shortname field
  // Event Suspects, Victims and Witnesses fields link to People's Shortname field
  autoFilterCollections: function(autoSelectCheckBoxes) {

    // Manage the filter transform name in this store and listening collection
    // stores can use it when broadcasted
    filterTransforms.transformName = this.transformName;

    // Call filterStateChanged on each data store to ensure each store's userFilteredCollection is up to date
    eventsStore.filterStateChanged(filterTransforms);
    placesStore.filterStateChanged(filterTransforms);
    peopleStore.filterStateChanged(filterTransforms);
    sourcesStore.filterStateChanged(filterTransforms);

    // Update all Event Checkboxes
    if (autoSelectCheckBoxes) {
      this.selectAllCheckboxes(eventsStore, true);
    }

    // Pass data onto views
    eventsStore.trigger(eventsStore.userFilteredCollection.data());
    placesStore.trigger(placesStore.userFilteredCollection.data());
    peopleStore.trigger(peopleStore.userFilteredCollection.data());
    sourcesStore.trigger(sourcesStore);

    this.message = {
      type: 'userFilteredCollectionsUpdated'
    };

    this.trigger(this);
  },

  // Select all checkboxes in a store
  selectAllCheckboxes: function(store, value) {
    store.showAllSelected = value;
  },

  // Update showRecord property of collections
  checkBoxUpdated: function(showRecordObject) {

    switch(showRecordObject.collectionName) {
      case config.EventsCollection:

        // Start process of updating related data tables
        this.eventsCheckBoxUpdated(showRecordObject.collectionData);

        // Set property on the events store so the show All checkbox state will be maintained
        eventsStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      case config.PlacesCollection:

        // Start process of updating related data tables
        this.placesCheckBoxUpdated(showRecordObject.item);

        // Set property on the events store so the show All checkbox state will be maintained
        placesStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      case config.PeopleCollection:

        // Set property on the events store so the show All checkbox state will be maintained
        peopleStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      case config.SourcesCollection:

        // Set property on the events store so the show All checkbox state will be maintained
        sourcesStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      default:
    }

    // ToDo: Update Checkboxes???


  },

  // Parse the 'Place' field of each events record to build up an array of all places associated with events
  // in order to automatically select related records in Places, People and Sources collections

  // Auto Update the Sources selected records based on the related documents field in Places
  eventsCheckBoxUpdated: function(eventsCollectionData) {

    var placeArray = [];

    eventsCollectionData.forEach(function(event) {

      var eventObject = {
        place: event.Place,
        showRecord: event.showRecord
      };

      placeArray.push(eventObject);
    });

    this.autoUpdatePlacesCheckboxes(uniq(placeArray));

    // TODO: autoUpdateSourcesCheckbox


  },

  // Set the highlightAsRelatedToEvent property based on whether the item is selected and is related to an event
  placesCheckBoxUpdated: function(placeCheckBoxObject) {

    if (placeCheckBoxObject) {

      placesStore.userFilteredCollection.copy().find({
        '$loki': {
          '$eq' : placeCheckBoxObject.$loki
        }
      }).update(function(placeObject) {

        if (placeCheckBoxObject.showRecord && placeCheckBoxObject.selectedByEvent) {
          placeObject.highlightAsRelatedToEvent = true;
        } else {
          placeObject.highlightAsRelatedToEvent = false;
        }
      });
    }

    // TODO: autoUpdateSourcesCheckbox


  },

  // Iterate through each record in Places collection and set showRecord to true and selectedByEvent to true
  autoUpdatePlacesCheckboxes: function(placeArray) {

    placeArray.forEach(function(eventObject) {
      placesStore.userFilteredCollection.copy().find({
        'Short Name': {
          '$eq' : eventObject.place
        }
      }).update(function(placeObject) {

        // If the event record is selected
        if (eventObject.showRecord) {
          placeObject.showRecord = true;
          placeObject.selectedByEvent = true;
          placeObject.highlightAsRelatedToEvent = true;
        } else {
          placeObject.showRecord = false;
          placeObject.selectedByEvent = false;
          placeObject.highlightAsRelatedToEvent = false;
        }
      });
    });
  }
});
