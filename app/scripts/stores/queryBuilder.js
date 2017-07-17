'use strict';

var Reflux = require('reflux');
var QueryBuilderActions = require('../actions/queryBuilder.js');
var dataSourceStore = require('../stores/dataSource.js');
var importPackageStore = require('../stores/importPackage.js');
var presentationsStore = require('../stores/presentations.js');
var queriesCollection = 'Queries';

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in QueryBuilderActions, using onKeyname (or keyname) as callbacks
  listenables: [QueryBuilderActions],

  packageName: 'ViewingFilter',

  // Called on Store initialisation
  init: function() {

    // Register importPackageStore's changes
    this.listenTo(importPackageStore, this.importPackageChanged);

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    // Register presentationStore changes
    this.listenTo(presentationsStore, this.presentationsChanged);

    // Used to prevent Checkboxes being displayed when none of the filters have values
    this.filtersWithValues = [];

    // Does the Query contain any events filters with values set by the user
    this.containsEvents = false;
  },

  // Add the images as blobs on the person's profile Object
  importPackageChanged: function (importPackageStore) {

    if (importPackageStore.message === 'importSuccess') {

      var queryCollection;

      queryCollection = dataSourceStore.dataSource.getCollection(queriesCollection);

      if (!queryCollection) {
        dataSourceStore.dataSource.addCollection(queriesCollection, { disableChangesApi: false });
      }

      this.createDefaultQuery('defaultQueryAdded');
    }
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSourceStore) {

    var queryCollection;

    if (dataSourceStore.dataSource.message.type === 'packageImported' || dataSourceStore.message === 'presentationSaved') {
      return;
    }

    queryCollection = dataSourceStore.dataSource.getCollection(queriesCollection);

    if (dataSourceStore.dataSource.message.type === 'dataBaseLoaded') {

      if (!queryCollection) {
        dataSourceStore.dataSource.addCollection(queriesCollection, { disableChangesApi: false });
      }

      this.createDefaultQuery('defaultQueryAdded');
    }
  },

  // Reset filters and selections
  presentationsChanged: function(presentationsStore) {

    var action;

    if (presentationsStore.lastAction === 'dataSourceChanged') {
      action = 'defaultQueryAdded';
    } else if (presentationsStore.lastAction === 'presentationStateChanged') {
      action = 'creatingSelected';
    } else {
      return;
    }

    if (presentationsStore.presentationState === 'creating') {
      this.packageName = 'ViewingFilter';
      this.resetFiltersWithValues();
      this.createDefaultQuery(action);
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

  // Create a default query object
  createDefaultQuery: function(action) {

    var queryObjectToClone;

    this.queryObject = {
      packageName: this.packageName,
      globalSearchValue: '',
      filters: []
    };

    queryObjectToClone = this.cloneDocument(this.queryObject, false);

    this.insertQueryObject(queryObjectToClone);

    this.message = {
      type: action
    };

    if (action !== 'importSuccess') {
      this.trigger(this);
    }
  },

  // Retrieve a query based on the transform name
  getQuery: function() {

    var queryCollection = dataSourceStore.dataSource.getCollection(queriesCollection);

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

    var queryCollection = dataSourceStore.dataSource.getCollection(queriesCollection);

    // Insert queryObject for this filter if it doesn't already exist
    if (queryCollection && queryCollection.find({ packageName: this.packageName }).length === 0) {
      queryCollection.insert(queryObject);
    }
  },

  // Update query object in collection
  updateQueryObject: function(queryObject) {

    var queryCollection = dataSourceStore.dataSource.getCollection(queriesCollection);

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

    var broadcastMessage = '';

    if (this.setPageToSearch(arg.value)) {
      arg.value = arg.value.split('-')[0];
    }

    if (action === 'add') {
      this.queryObject.filters.push(arg);
      this.message = {
        type: 'queryAdded' + broadcastMessage
      };
    } else if (action === 'remove') {

      var deletedFilter = this.queryObject.filters.splice(arg, 1)[0];

      this.manageFiltersWithValues(deletedFilter, 'remove');

      this.message = {
        type: 'queryUpdated' + broadcastMessage
      };
    } else if (action === 'update') {

      this.manageFiltersWithValues(arg, 'update');

      this.message = {
        type: 'queryUpdated' + broadcastMessage
      };
    }

    this.trigger(this);
  },

  // Set pageToSearch property if searchTerm matches Regex of pattern Kin-10496
  setPageToSearch: function(searchTerm) {

    if (new RegExp(/([a-z]+)-\w+/g).test(searchTerm)) {
      this.pageToSearch = searchTerm.split('-')[1];
      return true;
    }
    return false;
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

  // Reset filtersWithValues
  resetFiltersWithValues: function() {

    this.filtersWithValues = [];
  }
});
