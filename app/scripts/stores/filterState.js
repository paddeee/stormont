'use strict';

var Reflux = require('reflux');
var FilterStateActions = require('../actions/filterState.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // Send object out to all listeners when database loaded
    this.trigger(filterTransforms);
  },

  // Update filtered data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateFilteredData: function(searchFilterObject) {

      switch (searchFilterObject.collectionName) {
        case 'Events':
          filterTransforms.Events = this.createTransformObject(searchFilterObject);
          break;
        case 'Places':
          filterTransforms.Places = this.createTransformObject(searchFilterObject);
          break;
        case 'People':
          filterTransforms.People = this.createTransformObject(searchFilterObject);
          break;
        case 'Source':
          filterTransforms.Source = this.createTransformObject(searchFilterObject);
          break;
        default:
          console.log('No collection Name');
      }
  },

  // Create a filter transform object from a filter Object
  createTransformObject: function(filterTransformObject) {

    var transform = {
      type: 'find',
      value: {
        $and: []
      }
    };

    filterTransformObject.fields.forEach(function (field) {

      var fieldObject = {};

      fieldObject[field.name] = {
        '$regex': new RegExp(field.value, 'i')
      };

      transform.value.$and.push(fieldObject);
    });

    return transform;
  }
});
