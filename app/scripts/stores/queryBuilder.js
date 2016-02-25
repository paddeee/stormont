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

    if (dataSourceStore.dataSource.message.type === 'dataBaseLoaded') {

      if (!queryCollection) {
        queryCollection = dataSourceStore.dataSource.addCollection(config.QueriesCollection);
      }

      this.createDefaultQuery(queryCollection);

    } /*else if (dataSourceStore.dataSource.message.type === 'collectionImported') {
      this.getQuery();
    }*/
  },

  // When a presentation is saved
  presentationSaved: function(presentationObject) {

    var queryObjectToSave;

    /*if (presentationObject.presentationState === 'creating') {
      this.packageName = 'ViewingFilter';
    } else {*/
      this.packageName = presentationObject.presentationName;
    //}


    // If this presentation is a new one create a new object so we don't overwrite the one already in the collection
    if (this.packageName !== this.queryObject.packageName) {
      queryObjectToSave = this.cloneDocument(this.queryObject);
      queryObjectToSave.packageName = this.packageName;
      this.insertQueryObject(queryObjectToSave);
      this.queryObject.packageName = this.packageName;
    }
  },

  presentationDeleted: function(presentationObject) {
    this.queryObject.packageName = presentationObject.presentationName;
  },

  // Triggered when a package is chosen to be viewed or edited
  packageSelected: function (packageName) {
    this.packageName = packageName;
    this.getQuery();
  },

  // Create a default query if none exist
  createDefaultQuery: function() {

    var queryObjectToClone;

    this.queryObject = {
      packageName: this.packageName,
      globalSearchValue: '',
      filters: []
    };

    queryObjectToClone = this.cloneDocument(this.queryObject);

    this.insertQueryObject(queryObjectToClone);

    this.trigger(this);
  },

  // Retrieve a query based on the transform name
  getQuery: function() {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    var queryObject = queryCollection.find({
      packageName: this.packageName
    })[0];

    this.queryObject = this.cloneDocument(queryObject);

    this.trigger(this);
  },

  // Insert query object into collection
  insertQueryObject: function(queryObject) {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    // Insert queryObject for this filter if it doesn't already exist
    if (queryCollection.find({ packageName: this.packageName }).length === 0) {
      queryCollection.insert(queryObject);
    }
  },

  // Update query object in collection
  updateQueryObject: function(queryObject) {


  },

  // Deep Clone Query Object and remove $loki property
  cloneDocument: function(queryObject) {

    var queryObjectToClone = _.cloneDeep(queryObject);
    delete queryObjectToClone.$loki;
    return queryObjectToClone;
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
