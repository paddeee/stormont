'use strict';

var Reflux = require('reflux');
var filterTransforms = require('../config/filterTransforms.js');
var FilterStateActions = require('../actions/filterState.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  // Set search filter on our collectionTransform
  searchFilterChanged: function(searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // If the filter changed when creating or editing a saved package, set the transform name
    if (searchFilterObject.filterType === 'createPackage') {
      filterTransforms.creatingPackage = true;
    } else {
      filterTransforms.creatingPackage = false;
    }

    // Send object out to all listeners when database loaded
    this.trigger(filterTransforms);
  },

  // Set simpleSort on our collectionTransform
  sortingChanged: function(sortingObject) {

    this.updateSortedData(sortingObject);

    // Send object out to all listeners when database loaded
    this.trigger(filterTransforms);
  },

  // Update filtered data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateFilteredData: function(searchFilterObject) {

      switch (searchFilterObject.collectionName) {
        case 'Events':
          filterTransforms.Events.filters = this.createFilterObject(searchFilterObject);
          break;
        case 'Places':
          filterTransforms.Places.filters = this.createFilterObject(searchFilterObject);
          break;
        case 'People':
          filterTransforms.People.filters = this.createFilterObject(searchFilterObject);
          break;
        case 'Source':
          filterTransforms.Source.filters = this.createFilterObject(searchFilterObject);
          break;
        default:
          console.error('No collection Name');
      }
  },

  // Update sorted data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateSortedData: function(sortingObject) {

    switch (sortingObject.collectionName) {
      case 'Events':
        filterTransforms.Events.sorting = this.createSortingObject(sortingObject);
        break;
      case 'Places':
        filterTransforms.Places.sorting = this.createSortingObject(sortingObject);
        break;
      case 'People':
        filterTransforms.People.sorting = this.createSortingObject(sortingObject);
        break;
      case 'Source':
        filterTransforms.Source.sorting = this.createSortingObject(sortingObject);
        break;
      default:
        console.error('No collection Name');
    }
  },

  // Create a filter transform object from a filter Object
  createFilterObject: function(searchFilterObject) {

    var transform = {
      type: 'find',
      value: {
        $and: []
      }
    };

    searchFilterObject.fields.forEach(function (field) {

      var fieldObject = {};
      var queryObject = {};

      if (field.queryType !== 'regex') {
        queryObject[field.queryType] = field.value;
      } else {
        queryObject.$regex = new RegExp(field.value, 'i');
      }

      fieldObject[field.name] = queryObject;

      transform.value.$and.push(fieldObject);
    });

    return transform;
  },

  // Create a sorting transform object from a sorting Object
  createSortingObject: function(sortingObject) {

    var transform = {
      type: 'simplesort',
      property: sortingObject.fieldName,
      desc: sortingObject.desc
    };

    return transform;
  }
});
