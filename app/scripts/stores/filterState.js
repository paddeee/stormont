'use strict';

var Reflux = require('reflux');
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

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // Send object out to all listeners when database loaded
    //this.trigger(this.filterState);
  },

  // Update filtered data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateFilteredData: function(searchFilterObject) {

    var filterCollection;

      switch (searchFilterObject.collectionName) {
        case 'Events':
          filterCollection = this.filterState.Events;
          break;
        case 'Places':
          filterCollection = this.filterState.Places;
          break;
        case 'People':
          filterCollection = this.filterState.People;
          break;
        case 'Source':
          filterCollection = this.filterState.Source;
          break;
        default:
          console.log('No collection Name');
      }
console.log(searchFilterObject);
    //filterCollection.name = searchFilterObject.field.value;
  }
});
