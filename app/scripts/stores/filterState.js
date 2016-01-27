'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var filterTransforms = require('../config/filterTransforms.js');
var FilterStateActions = require('../actions/filterState.js');
var eventsStore = require('../stores/events.js');
var placesStore = require('../stores/places.js');
var peopleStore = require('../stores/people.js');
var sourcesStore = require('../stores/source.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in FilterStateActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  init: function() {
    this.transformName = 'ViewingFilter';
  },

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // Manage the filter transform name in this store and listening collection
    // stores can use it when broadcasted
    filterTransforms.transformName = this.transformName;

    // Call filterStateChanged on each data store
    eventsStore.filterStateChanged(filterTransforms);
    placesStore.filterStateChanged(filterTransforms);
    peopleStore.filterStateChanged(filterTransforms);
    sourcesStore.filterStateChanged(filterTransforms);

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollection
    // method
    console.log(eventsStore.userFilteredCollection);
    console.log(placesStore.userFilteredCollection);
    console.log(peopleStore.userFilteredCollection);
    console.log(sourcesStore.userFilteredCollection);
  },

  // Set simpleSort on our collectionTransform
  sortingChanged: function(sortingObject) {

    this.updateSortedData(sortingObject);

    // Manage the filter transform name in this store and listening collection
    // stores can use it when broadcasted
    filterTransforms.transformName = this.transformName;

    // Call filterStateChanged on each data store
    eventsStore.filterStateChanged(filterTransforms);
    placesStore.filterStateChanged(filterTransforms);
    peopleStore.filterStateChanged(filterTransforms);
    sourcesStore.filterStateChanged(filterTransforms);
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
  }
});
