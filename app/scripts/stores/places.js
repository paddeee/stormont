'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var filterStateStore = require('../stores/filterState.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  //listenables: [FilterStateActions],

  // Name to use for this collection
  collectionName: 'Places',

  // The filtered places object
  filteredEvents: null,

  // The Loki places transform array
  placesTransform: [],

  // Called on Store initialistion
  init: function() {

    // Register filterStateStore's changes
    this.listenTo(filterStateStore, this.filterStateChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function () {

    // Send object out to all listeners when database loaded
    this.trigger(this.filteredEvents);
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterStateObject) {

    var collectionToAddTransformTo = dataSourceStore.dataSource.getCollection(this.collectionName);
    var filterTransformObject = this.createTransformObject(filterStateObject.Places);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Add filter to the transform
    this.placesTransform.push(filterTransformObject);

    // Save the transform to the collection
    if (collectionToAddTransformTo.chain('PaddyFilter')) {
      collectionToAddTransformTo.setTransform('PaddyFilter', this.placesTransform);
    } else {
      collectionToAddTransformTo.addTransform('PaddyFilter', this.placesTransform);
    }

    this.filteredEvents = collectionToAddTransformTo.chain('PaddyFilter').data();

    // Send object out to all listeners
    this.trigger(this.filteredEvents);
  },

  // Create a filter transform object from a filter Object
  createTransformObject: function(filterTransformObject) {

    return {
      type: 'find',
      value: {
        'name': {
          '$contains' : filterTransformObject.name
        },
        'type': {
          '$contains' : filterTransformObject.type
        }
      }
    };
  }
});
