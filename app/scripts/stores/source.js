'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
var filterTransform = require('../config/filterTransforms.js');
var filterStateStore = require('../stores/filterState.js');
var presentationsStore = require('../stores/presentations.js');
var SourceActions = require('../actions/source.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in SourceActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [SourceActions],

  // Name to use for this collection
  collectionName: config.SourcesCollection,

  // Data storage for all collections
  dataSource: null,

  // The Loki collection transform array
  collectionTransform: [],

  // Called on Store initialisation
  init: function() {

    // Set filterTransform property on the object from the required config data
    this.filterTransform = filterTransform;

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);

    // Register filterStateStore's changes
    this.listenTo(filterStateStore, this.filterStateChanged);

    this.listenTo(presentationsStore, this.presentationsStoreChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSourceStore) {

    this.dataSource = dataSourceStore.dataSource;

    this.setDefaultFilter();

    // Call when the source data is updated
    this.filterStateChanged(this.filterTransform);
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformBroadcast) {

    // If the incoming parameter is a string, we are setting the transform from a pre-existing one
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

    var collectionTransformObject = filterTransformObject[this.collectionName];
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

      var filteredCollection = collectionToAddTransformTo.chain(filterTransformObject.transformName);

      // Example of filtering on a branched subset of data
      console.log(filteredCollection.copy().find({'Full Name':{'$contains': ['M']}}).data());

      this.filteredCollection = collectionToAddTransformTo.chain(filterTransformObject.transformName).data();

      // Send object out to all listeners
      this.trigger(this);
    }

    // Don't set the branched collection if saving a presentation.
    if (message !== 'presentationSaved') {

      this.filteredCollection = collectionToAddTransformTo.chain(filterTransformObject.transformName).data();

      // Send object out to all listeners
      this.trigger(this);
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
    this.filteredCollection = collectionToAddTransformTo.chain(transformName).data();

    // Set viewingSource property to false
    this.viewingSource = false;

    // Send collection object out to all listeners
    this.trigger(this);
  },

  // Reset a transform on this collection
  resetFilterTransform: function() {

    var collectionToAddTransformTo;
    var transformName = 'DefaultFilter';

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
    this.filteredCollection = collectionToAddTransformTo.chain(transformName).data();

    // Set viewingSource property to false
    this.viewingSource = false;

    // Send collection object out to all listeners
    this.trigger(this);
  },

  //
  setDefaultFilter: function() {

    var collectionToAddTransformTo;

    if (!this.dataSource) {
      return;
    }

    collectionToAddTransformTo = this.dataSource.getCollection(this.collectionName);

    if (!collectionToAddTransformTo) {
      return;
    }

    this.collectionTransform = [];
    this.collectionTransform.push(filterTransform[this.collectionName].filters);
    this.collectionTransform.push(filterTransform[this.collectionName].sorting);

    collectionToAddTransformTo.setTransform('DefaultFilter', this.collectionTransform);
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
