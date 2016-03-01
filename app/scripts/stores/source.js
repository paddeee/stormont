'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
var presentationsStore = require('../stores/presentations.js');
var SourceActions = require('../actions/source.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in SourceActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [SourceActions],

  // Name to use for this collection
  collectionName: config.SourcesCollection.name,

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
    this.filterStateChanged(this.filterTransform);
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformBroadcast) {

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

      // Apply the filter
      this.userFilteredCollection = collectionToAddTransformTo.chain(collectionToAddTransformTo.transforms[filterTransformObject.transformName][0], this.params).copy();

      // Apply the sort
      this.userFilteredCollection.simplesort(collectionTransformObject.sorting.property, collectionTransformObject.sorting.desc);

    } else {

      if (message !== 'presentationSaved') {
        this.userFilteredCollection = collectionToAddTransformTo.chain().copy();
      }
    }

    // Set viewingSource property to false
    this.viewingSource = false;
  },

  // Retrieve a transform from the db using a transform name
  updateFilterTransform: function(transformName) {

    var collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    // Update this store's filterTransform so the filters will be updated when a presentation changes
    if (!this.dataSource.getCollection(this.collectionName).transforms[transformName]) {
      return;
    }

    this.filterTransform[this.collectionName].filters = this.dataSource.getCollection(this.collectionName).transforms[transformName][0];

    // Update the collection resulting from the transform
    this.userFilteredCollection = collectionToAddTransformTo.chain(collectionToAddTransformTo.transforms[transformName][0]);

    // Set viewingSource property to false
    this.viewingSource = false;

    // Send collection object out to all listeners
    this.trigger(this);
  },

  // Reset a transform on this collection
  resetFilterTransform: function() {

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

    // Set viewingSource property to false
    this.viewingSource = false;

    // Send collection object out to all listeners
    this.trigger(this);
  },

  // Set a default transform to be used immediately on the store
  setDefaultTransform: function() {
    console.log('Places - setDefaultFilter');

    var collectionToAddTransformTo;

    this.filterTransform = {};
    this.filterTransform[this.collectionName] = {
      filters: [{
        type: 'find',
        value: {
          '$and': []
        }
      },
      {
        type: 'where',
        value: '[%lktxp]filterDates'
      }],
      sorting: {
        type: 'simplesort',
        property: '$loki',
        desc: true
      },
      dateQueries: {
        from: [],
        to: []
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
    config.SourcesCollection.fields.forEach(function(filter) {
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

    var validItem;
    var fromArray = this.filterTransform[this.collectionName].dateQueries.from;
    var toArray = this.filterTransform[this.collectionName].dateQueries.to;
    var fromDefaultObject = {
      includeExclude: 'include',
      value: '1900-01-01 00:00:00'
    };
    var toDefaultObject = {
      includeExclude: 'include',
      value: '2100-01-01 00:00:00'
    };

    if (!fromArray.length) {
      fromArray.push(fromDefaultObject);
    } else if (!toArray.length) {
      toArray.push(toDefaultObject);
    }

    // Sort arrays so dates are in order in each array
    fromArray = _.sortBy(fromArray, function(object) {
      return object.value;
    });

    toArray = _.sortBy(toArray, function(object) {
      return object.value;
    });

    // If more From filters than To filters
    if (fromArray.length >= toArray.length) {

      fromArray.forEach(function(fromObject, index) {

        var toObject = toArray[index];

        // If no corresponding To Date, set it to a far future date
        if (!toObject) {
          toObject = toDefaultObject;
        }

        // If the date filter is an include
        if (toObject.includeExclude === 'include') {

          if (obj[this.fromFilterName] > fromObject.value && obj[this.toFilterName] < toObject.value) {
            validItem = true;
          }
        } else if (toObject.includeExclude === 'exclude') {

          if (obj[this.fromFilterName] > fromObject.value && obj[this.fromFilterName] < toObject.value) {
            validItem = true;
          }
        }
      }.bind(this));

      // Catch-all in case user adds more to filters than from filters which would be wrong anyway
    } else {

      toArray.forEach(function(toObject, index) {

        var fromObject = fromArray[index];

        // If no corresponding From Date, set it to a far past date
        if (!fromObject) {
          fromObject = fromDefaultObject;
        }

        // If the date filter is an include
        if (fromObject.includeExclude === 'include') {

          if (obj[this.fromFilterName] > fromObject.value && obj[this.fromFilterName] < toObject.value) {
            validItem = true;
          }
        } else if (fromObject.includeExclude === 'exclude') {

          if (obj[this.fromFilterName] > fromObject.value && obj[this.toFilterName] < toObject.value) {
            validItem = true;
          }
        }

      }.bind(this));
    }

    return validItem;
  },

  // Called when a user attempts to view a source file
  viewSourceFile: function(sourceObject) {

    // Set selectedSourceObject property
    this.setSelectedSourceObject(sourceObject);

    // Hack based around need to trigger pdf creation in pdf element so we broadcast a change to null
    // before sending out the object again.
    if (!sourceObject) {
      this.trigger(this);
      return;
    }

    // Set selectedSourceObject property
    this.setSelectedSourceFileType(sourceObject);

    // Set viewingSource property to true
    this.viewingSource = true;

    // Send object out to all listeners
    this.trigger(this);
  },

  // Set a property on this store object to indicate current selected source object
  setSelectedSourceObject: function(sourceObject) {
    this.selectedSourceObject = sourceObject;
  },

  // Set a property on this store object to indicate the type of file
  setSelectedSourceFileType: function(sourceObject) {

    var filePath = sourceObject.Src;
    var fileExtension = filePath.substr(filePath.lastIndexOf('.') + 1);

    switch (fileExtension) {
      case 'pdf':
        this.selectedSourceRoute = 'pdf';
        this.selectedSourceFileType = 'pdf';
        break;
      case 'jpg':
        this.selectedSourceRoute = 'image';
        this.selectedSourceFileType = 'image';
        break;
      case 'jpeg':
        this.selectedSourceRoute = 'image';
        this.selectedSourceFileType = 'image';
        break;
      case 'gif':
        this.selectedSourceRoute = 'image';
        this.selectedSourceFileType = 'image';
        break;
      case 'png':
        this.selectedSourceRoute = 'image';
        this.selectedSourceFileType = 'image';
        break;
      case 'mp3':
        this.selectedSourceRoute = 'media';
        this.selectedSourceFileType = 'audio';
        break;
      case 'wav':
        this.selectedSourceRoute = 'media';
        this.selectedSourceFileType = 'audio';
        break;
      case 'avi':
        this.selectedSourceRoute = 'media';
        this.selectedSourceFileType = 'video';
        break;
      case 'mp4':
        this.selectedSourceRoute = 'media';
        this.selectedSourceFileType = 'video';
        break;
      case 'mov':
        this.selectedSourceRoute = 'media';
        this.selectedSourceFileType = 'video';
        break;
      case 'webm':
        this.selectedSourceRoute = 'media';
        this.selectedSourceFileType = 'video';
        break;
      default:
        console.warn(fileExtension + 'not a supported type');
    }
  }
});
