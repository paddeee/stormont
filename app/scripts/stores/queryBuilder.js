'use strict';

var Reflux = require('reflux');
var QueryBuilderActions = require('../actions/queryBuilder.js');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
var presentationsStore = require('../stores/presentations.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in QueryBuilderActions, using onKeyname (or keyname) as callbacks
  listenables: [QueryBuilderActions],

  // Data storage for all collections
  dataSource: null,

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    this.listenTo(presentationsStore, this.presentationsStoreChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSourceStore) {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    // Create/Update a QueriesCollection collection in the database
    if (queryCollection) {
      this.getQuery();
    } else {
      dataSourceStore.dataSource.addCollection(config.QueriesCollection);
      this.createDefaultQuery();
    }

    this.trigger(this);
  },

  // Listener to changes on Presentations Store
  presentationsStoreChanged: function() {

    console.log('Presentations Store changed');
  },

  // Create a default query if none exist
  createDefaultQuery: function() {

    this.queryObject = {
      packageName: 'ViewingFilter',
      globalSearchValue: '',
      filters: []
    }
  },

  // Retrieve a query based on the transform name
  getQuery: function() {

  },

  queryFiltersChanged: function(customQueryObject, action) {

    if (action === 'add') {
      this.queryObject.filters.push(customQueryObject);
    }

    this.trigger(this);
  }
});
