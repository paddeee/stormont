'use strict';

var Reflux = require('reflux');
var QueryBuilderActions = require('../actions/queryBuilder.js');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in QueryBuilderActions, using onKeyname (or keyname) as callbacks
  listenables: [QueryBuilderActions],

  packageName: 'ViewingFilter',

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
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

  // Triggered when a package is chosen to be viewed or edited
  packageSelected: function (packageName) {
    this.packageName = packageName;
  },

  // Create a default query if none exist
  createDefaultQuery: function() {

    this.queryObject = {
      packageName: this.packageName,
      globalSearchValue: '',
      filters: []
    };
  },

  // Retrieve a query based on the transform name
  getQuery: function() {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);
    console.log(queryCollection);
  },

  queryFiltersChanged: function(arg, action) {

    if (action === 'add') {
      this.queryObject.filters.push(arg);
    } else if (action === 'remove') {
      this.queryObject.filters.splice(arg, 1);
    }

    this.trigger(this);
  }
});
