'use strict';

var Reflux = require('reflux');
var FilterStateActions = require('../actions/filterState.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  // The Loki db object
  // ToDO: Abstract out to config file
  filterTransforms: {
    Events: {
      type: 'find',
      value: {
        'name': {
          '$regex' : new RegExp('', 'i')
        },
        'type': {
          '$regex' : new RegExp('', 'i')
        }
      }
    },
    Places: {
      type: 'find',
      value: {
        'name': {
          '$regex' : new RegExp('', 'i')
        },
        'type': {
          '$regex' : new RegExp('', 'i')
        }
      }
    },
    People: {
      type: 'find',
      value: {
        'name': {
          '$regex' : new RegExp('', 'i')
        },
        'type': {
          '$regex' : new RegExp('', 'i')
        }
      }
    },
    Source: {
      type: 'find',
      value: {
        'name': {
          '$regex' : new RegExp('', 'i')
        },
        'type': {
          '$regex' : new RegExp('', 'i')
        }
      }
    }
  },

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // Send object out to all listeners when database loaded
    this.trigger(this.filterTransforms);
  },

  // Update filtered data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateFilteredData: function(searchFilterObject) {

      switch (searchFilterObject.collectionName) {
        case 'Events':
          this.filterTransforms.Events = this.createTransformObject(searchFilterObject);
          break;
        case 'Places':
          this.filterTransforms.Places = this.createTransformObject(searchFilterObject);
          break;
        case 'People':
          this.filterTransforms.People = this.createTransformObject(searchFilterObject);
          break;
        case 'Source':
          this.filterTransforms.Source = this.createTransformObject(searchFilterObject);
          break;
        default:
          console.log('No collection Name');
      }
  },

  // Create a filter transform object from a filter Object
  createTransformObject: function(filterTransformObject) {

    var value = {};

    filterTransformObject.fields.forEach(function(field) {
      value[field.name] = {
        '$regex' : new RegExp(field.value, 'i')
      };
    });

    return {
      type: 'find',
      value: value
    };
  },

  //
});
