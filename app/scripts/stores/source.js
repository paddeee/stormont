'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var filterTransform = require('../config/filterTransforms.js');
var filterStateStore = require('../stores/filterState.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: 'Source',

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

    var collectionTransformObject = filterTransformObject.Source;
    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Add filter to the transform
    this.collectionTransform = []; // ToDo push transform if new, replace if not
    this.collectionTransform.push(collectionTransformObject.filters);
    this.collectionTransform.push(collectionTransformObject.sorting);

    // Save the transform to the collection
    if (collectionToAddTransformTo.chain('ImportFilter')) {
      collectionToAddTransformTo.setTransform('ImportFilter', this.collectionTransform);
    } else {
      collectionToAddTransformTo.addTransform('ImportFilter', this.collectionTransform);
    }

    this.filteredEvents = collectionToAddTransformTo.chain('ImportFilter').data();

    // Send object out to all listeners
    this.trigger(this.filteredEvents);
  }
});
