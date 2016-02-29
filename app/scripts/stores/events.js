'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
var presentationsStore = require('../stores/presentations.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: config.EventsCollection.name,

  // Data storage for all collections
  dataSource: null,

  // The Loki collection transform array
  collectionTransform: [],

  // Called on Store initialisation
  init: function() {

    this.setDefaultTransform();

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    this.listenTo(presentationsStore, this.presentationsStoreChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSourceStore) {

    this.dataSource = dataSourceStore.dataSource;

    this.setDefaultTransform();

    // Call when the source data is updated
    this.createFilterTransform(this.filterTransform, dataSourceStore.message);
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformBroadcast) {

    this.setDatesTransform();

    // If the incoming parameter is a string, we are setting the transform from a pre-existing one
    // (i.e viewing an existing package)
    if (typeof filterTransformBroadcast === 'string') {
      this.updateFilterTransform(filterTransformBroadcast);
    } else {
      this.createFilterTransform(filterTransformBroadcast);
    }
  },

  // Listener to changes on Presentations Store
  presentationsStoreChanged: function() {

    // If presentation name has been set to 'ViewingFilter', reset the presentation
    if (presentationsStore.presentationName === 'ViewingFilter') {
      this.resetFilterTransform();
    }
  },

  // Create a transform from the passed in object and save it on the collection
  createFilterTransform: function(filterTransformObject, message) {
    console.log('Events - createFilterTransform');

    if (!this.dataSource) {
      return;
    }

    var collectionTransformObject = this.filterTransform[this.collectionName];
    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Add filter to the transform
    this.collectionTransform = [];
    this.collectionTransform.push(collectionTransformObject.filters);
    this.collectionTransform.push(collectionTransformObject.sorting);

    // Save the transform to the collection
    if (filterTransformObject.transformName) {

      if (collectionToAddTransformTo.chain(filterTransformObject.transformName)) {
        collectionToAddTransformTo.setTransform(filterTransformObject.transformName, this.collectionTransform);
      } else {
        collectionToAddTransformTo.addTransform(filterTransformObject.transformName, this.collectionTransform);
      }

      this.userFilteredCollection = collectionToAddTransformTo.chain(collectionToAddTransformTo.transforms[filterTransformObject.transformName][0], this.params).copy();

    } else {

      if (message !== 'presentationSaved') {
        this.userFilteredCollection = collectionToAddTransformTo.chain().copy();
      }
    }
  },

  // When a collection is filtered, the removed records need to be set to not selected.
  // Otherwise, any records in the other data types will still be selected even though the record which made
  // them selected has been filtered out
  setFilteredOutItemsToNotSelected: function(eventsCollection, filteredEventsCollection) {
    _.difference(eventsCollection, filteredEventsCollection).forEach(function(eventObject) {
      eventObject.showRecord = false;
    });
  },

  // Retrieve a transform from the db using a transform name
  updateFilterTransform: function(transformName) {
    console.log('Events - updateFilterTransform');

    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Update this store's filterTransform so the filters will be updated when a presentation changes
    if (this.dataSource.getCollection(this.collectionName).transforms[transformName][0]) {
      this.filterTransform[this.collectionName].filters = this.dataSource.getCollection(this.collectionName).transforms[transformName][0];
    }

    // Update the collection resulting from the transform
    this.userFilteredCollection = collectionToAddTransformTo.chain(collectionToAddTransformTo.transforms[transformName][0]);

    // Send collection object out to all listeners
    this.trigger(this.userFilteredCollection.data());
  },

  // Reset a transform on this collection
  resetFilterTransform: function() {
    console.log('Events - resetFilterTransform');

    var collectionToAddTransformTo;
    var transformName = 'ViewingFilter';

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
    this.userFilteredCollection = collectionToAddTransformTo.chain(transformName);

    // Send collection object out to all listeners
    this.trigger(this.userFilteredCollection.data());
  },

  // Set a default transform to be used immediately on the store
  setDefaultTransform: function() {
    console.log('Events - setDefaultFilter');

    var collectionToAddTransformTo;

    this.filterTransform = {};
    this.filterTransform[this.collectionName] = {
      filters: [{
        type: 'find',
        value: {
          '$and': [ {
            'Full Name': {
              '$regex': ['', 'i']
            }
          }]
        }
      },
      {
        type: 'where',
        value: '[%lktxp]filterDates'
      }
        /*{
        type: 'find',
        value: {
          '$or': [
            {
              'Begin Date and Time': {
                $lte: '1999-03-07 00:00:00',
                $gte: '1999-12-06 00:00:00'
              }
            },
            {
              'End Date and Time': {
                $lte: '2001-12-07 00:00:00'
              }
            },
            {
              'Begin Date and Time': {
                $gte: '1998-03-06 00:00:00'
              }
            },
            {
              'End Date and Time': {
                $lte: '2001-12-07 00:00:00'
              }
            }
          ]
        }
      }*/],
      sorting: {
        type: 'simplesort',
        property: '$loki',
        desc: true
      },
      dateQueries: {
        include: [],
        exclude: []
      }
    };

    this.setDatesTransform();

    if (!this.dataSource) {
      return;
    }

    collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    this.collectionTransform = [];
    this.collectionTransform.push(this.filterTransform[this.collectionName].filters);
    this.collectionTransform.push(this.filterTransform[this.collectionName].sorting);

    collectionToAddTransformTo.setTransform('ViewingFilter', this.collectionTransform);
  },

  // Set up functionality to perform a 'where' query on selected Date filters
  setDatesTransform: function() {

    // Get name of Field with a filter type of 'gte'
    config.EventsCollection.fields.forEach(function(filter) {
      if (filter.filter === 'gte') {
        this.fromFilterName = filter.name;
      } else if (filter.filter === 'lte') {
        this.toFilterName = filter.name;
      }
    }.bind(this));

    // Transform Params to be used in collection chain transforms
    this.params = {
      filterDates: this.filterDates
    };
  },

  // Used by the lokijs 'where' query to filter on dates in a transform
  filterDates: function (obj) {
    console.log(obj, this.filterTransform[this.collectionName].dateQueries);
    return obj[this.fromFilterName] > '1999-03-06';
  }
});
