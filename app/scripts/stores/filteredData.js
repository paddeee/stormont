'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var dataSourceStore = require('../stores/dataSource.js');
var FilteredDataActions = require('../actions/filteredData.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [FilteredDataActions],

  // The Loki db object
  filteredData: null,

  // Called on Store initialistion
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function (dataSource) {

    this.filteredData = dataSource;

    // Send object out to all listeners when database loaded
    this.trigger(this.filteredData);
  }
});
