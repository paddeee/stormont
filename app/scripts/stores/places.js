'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var filterTransform = require('../config/filterTransforms.js');
var filterStateStore = require('../stores/filterState.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: 'Places',

  // Data storage for all collections
  dataSource: null,

  // Default state object on application load
  filterTransform: null,

  // The filtered places object
  filteredEvents: null,

  // The Loki collection transform array
  collectionTransform: [],

  // Called on Store initialistion
  init: function() {

    // Set filterTransform property on the object from the required config data
    this.filterTransform = filterTransform;

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    // Register filterStateStore's changes
    this.listenTo(filterStateStore, this.filterStateChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSource) {

    this.dataSource = dataSource;

    // Call when the source data is updated
    this.filterStateChanged(this.filterTransform);
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformObject) {

    if (!this.dataSource) {
      return;
    }

    var placesTransformObject = filterTransformObject.Places;
    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    // Add filter to the transform
    this.collectionTransform = []; // ToDo push transform if new, replace if not
    this.collectionTransform.push(placesTransformObject);

    // Save the transform to the collection
    if (collectionToAddTransformTo.chain('PaddyFilter')) {
      collectionToAddTransformTo.setTransform('PaddyFilter', this.collectionTransform);
    } else {
      collectionToAddTransformTo.addTransform('PaddyFilter', this.collectionTransform);
    }

    this.filteredEvents = collectionToAddTransformTo.chain('PaddyFilter').data();

    // Send object out to all listeners
    this.trigger(this.filteredEvents);
  }
});
