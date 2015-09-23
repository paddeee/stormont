'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var FilterStateActions = require('../actions/filterState.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  // The Loki db object
  // ToDO: Abstract out to config file
  filterState: {
    Events: {
      name: '',
      type: ''
    },
    Places: {
      name: ''
    },
    People: {
      name: ''
    },
    Source: {
      name: ''
    }
  },

  // The Loki db object
  collectionTransform: [],

  // Called on Store initialistion
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function () {

    // Send object out to all listeners when database loaded
    this.trigger(this.filterState);
  },

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {



    console.log(searchFilterObject);

    // Send object out to all listeners when database loaded
    //this.trigger(this.filteredData);
  }
});
