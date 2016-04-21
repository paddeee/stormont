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

    // Used to prevent Checkboxes being displayed when none of the filters have values
    this.filtersWithValues = [];

    // Does the Query contain any events filters with values set by the user
    this.containsEvents = false;
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSourceStore) {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    if (dataSourceStore.message === 'presentationSaved') {
      return;
    }

    if (dataSourceStore.dataSource.message.type === 'dataBaseLoaded') {

      if (!queryCollection) {
        queryCollection = dataSourceStore.dataSource.addCollection(config.QueriesCollection);
      }

      this.createDefaultQuery(queryCollection);
    }
  },

  // When a presentation is saved
  presentationSaved: function(presentationObject) {

    var queryObjectToSave;

    this.queryObject.packageName = this.packageName;
    this.packageName = presentationObject.presentationName;

    // If this presentation is a new one
    if (presentationObject.presentationState === 'creating') {
      queryObjectToSave = this.cloneDocument(this.queryObject, true);
      this.insertQueryObject(queryObjectToSave);
    } else if (presentationObject.presentationState === 'editing') {
      queryObjectToSave = this.cloneDocument(this.queryObject, false);
      this.updateQueryObject(queryObjectToSave);
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

    queryObjectToClone = this.cloneDocument(this.queryObject, false);

    this.insertQueryObject(queryObjectToClone);

    this.message = {
      type: 'defaultQueryAdded'
    };

    this.trigger(this);
  },

  // Retrieve a query based on the transform name
  getQuery: function() {

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    var queryObject = queryCollection.find({
      packageName: this.packageName
    })[0];

    this.queryObject = this.cloneDocument(queryObject, false);

    this.message = {
      type: 'packageSelected'
    };

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

    var queryCollection = dataSourceStore.dataSource.getCollection(config.QueriesCollection);

    queryCollection.update(queryObject);
  },

  // Deep Clone Query Object and remove $loki property
  cloneDocument: function(queryObject, removeLoki) {

    var queryObjectToClone = _.cloneDeep(queryObject);
    queryObjectToClone.packageName = this.packageName;

    if (removeLoki) {
      delete queryObjectToClone.$loki;
    }

    return queryObjectToClone;
  },

  queryFiltersChanged: function(arg, action) {

    if (action === 'add') {
      this.queryObject.filters.push(arg);
      this.message = {
        type: 'queryAdded'
      };
    } else if (action === 'remove') {

      var deletedFilter = this.queryObject.filters.splice(arg, 1)[0];

      this.manageFiltersWithValues(deletedFilter, 'remove');

      this.message = {
        type: 'queryRemoved'
      };
    } else if (action === 'update') {

      this.manageFiltersWithValues(arg, 'update');

      this.message = {
        type: 'queryUpdated'
      };
    }

    this.trigger(this);
  },

  // Used to prevent Checkboxes being displayed when none of the filters have values
  manageFiltersWithValues: function(filter, action) {

    if (action === 'add') {
      this.addFilterWithValues(filter);
    } else if (action === 'update') {
      this.updateFilterWithValues(filter);
    } else if (action === 'remove') {
      this.removeFilterWithValues(filter);
    }

    this.manageContainsEventFilters();
  },

  // See whether to add an object to filtersWithValues
  addFilterWithValues: function(filterToAdd) {

    var filterExists;

    // Check to see if filter already exists
    this.filtersWithValues.forEach(function(filterObject) {

      if (filterToAdd.collectionName === filterObject.collectionName && filterToAdd.fieldName === filterObject.fieldName && filterToAdd.value === filterObject.value) {
        filterExists = true;
      }
    }.bind(this));

    if (!filterExists && filterToAdd.value !== '') {
      this.filtersWithValues.push(filterToAdd);
    }
  },

  // See whether to remove an object from filtersWithValues
  updateFilterWithValues: function(updatedFilter) {

    if (updatedFilter.value === '') {
      this.removeFilterWithValues(updatedFilter);
    } else {
      this.addFilterWithValues(updatedFilter);
    }
  },

  // Remove an object from filtersWithValues
  removeFilterWithValues: function(filterToRemove) {

    var tempFilterWithValues;

    tempFilterWithValues = this.filtersWithValues.filter(function(filterObject) {

      var validItem = false;

      if (filterToRemove.collectionName !== filterObject.collectionName || filterToRemove.fieldName !== filterObject.fieldName || filterToRemove.value !== filterObject.value) {
        validItem = true;
      }

      return validItem;
    }.bind(this));

    this.filtersWithValues = tempFilterWithValues;
  },

  // Manage property to indicate if there are any event filters. Because if not, the application shouldn't select all
  // event checkboxes if a filter is added to a different data type. Otherwise a filter on people will select all
  // events which will select more people which would be confusing to user.
  manageContainsEventFilters: function() {

    var containsEvents = false;

    this.filtersWithValues.forEach(function(filter) {

      if (filter.collectionName === config.EventsCollection.name) {
        containsEvents = true;
      }
    });

    this.containsEvents = containsEvents;
  }
});
