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

      if (queryCollection.data.length > 0) {
        this.getQuery();
      } else {
        this.createDefaultQuery(queryCollection);
      }
    } else {
      queryCollection = dataSourceStore.dataSource.addCollection(config.QueriesCollection);
      this.createDefaultQuery(queryCollection);
    }
  },

  presentationSaved: function(presentationObject) {
    this.queryObject.packageName = presentationObject.presentationName;
  },

  // Triggered when a package is chosen to be viewed or edited
  packageSelected: function (packageName) {
    this.packageName = packageName;
    this.getQuery();
  },

  // Create a default query if none exist
  createDefaultQuery: function(queryCollection) {

    // If ViewingFilter Object already exists no need to add another one
    if (queryCollection.find({ packageName: this.packageName }).length > 0) {
      return;
    }

    this.queryObject = {
      packageName: this.packageName,
      globalSearchValue: '',
      filters: []
    };

    queryCollection.insert(this.queryObject);

    this.trigger(this);
  },

  // Retrieve a query based on the transform name
  getQuery: function() {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    // If this is a new package create a new object instead
    if (this.packageName === 'ViewingFilter') {
      this.createDefaultQuery(queryCollection);
      return;
    }

    this.queryObject = queryCollection.find({
      packageName: this.packageName
    })[0];

    this.trigger(this);
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
