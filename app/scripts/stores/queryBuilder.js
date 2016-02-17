'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
var presentationsStore = require('../stores/presentations.js');

module.exports = Reflux.createStore({

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

    console.log('Datasource changed');
  },

  // Set search filter on our collectionTransform
  filterStateChanged: function(filterTransformBroadcast) {

    console.log('Filterstate changed');
  },

  // Listener to changes on Presentations Store
  presentationsStoreChanged: function() {

    console.log('Presentations Store changed');
  }
});
