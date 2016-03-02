'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var selectedRecordsStore = require('../stores/selectedRecords.js');

module.exports = Reflux.createStore({

  // Name to use for this collection
  collectionName: config.MapGeoJSONCollection,

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(selectedRecordsStore, this.createGeoJSON);
  },

  // Create a GeoJSON Object that can be used by the Map and Timeline to visualise data
  createGeoJSON: function() {

    // Create an empty GeoJSON object
    var geoJSONObject = {
      'type': 'FeatureCollection',
      'features': []
    };

    // Assign selected events from each store
    this.selectedEvents = selectedRecordsStore.selectedRecords[config.EventsCollection.name];
    this.selectedPlaces = selectedRecordsStore.selectedRecords[config.PlacesCollection.name];
    this.selectedPeople = selectedRecordsStore.selectedRecords[config.PeopleCollection.name];
    this.selectedSources = selectedRecordsStore.selectedRecords[config.SourcesCollection.name];

    // Push a feature object for each Event record
    this.selectedEvents.data().forEach(function(selectedEvent) {

      geoJSONObject = this.getFeatureObject(selectedEvent, geoJSONObject);

    }.bind(this));

    this.trigger(geoJSONObject);
  },

  // Return a GeoJSON Feature Object if event has related place selected
  getFeatureObject: function(selectedEvent, geoJSONObject) {

    var featureObject = {
      'type': 'Feature',
      'properties': {
        'id': selectedEvent.$loki,
        'eventName': selectedEvent['Full Name'],
        'eventDescription': selectedEvent['Description'],
        'type': selectedEvent['Type'],
        'relatedPeople': [
          {
            name: 'Person B'
          },
          {
            name: 'Person D'
          }
        ],
        'supportingDocuments': []
      }
    };

    // Don't add to GeoJSON if no related place exists
    if (!this.addPlaceDataToGeoJSON(featureObject, selectedEvent)) {
      return;
    }

    this.addRelatedPeopleDataToGeoJSON(featureObject);

    // Push features onto the GeoJSON Object
    geoJSONObject.features.push(featureObject);

    return geoJSONObject;
  },

  // Add Place data to the geoJSON Object
  addPlaceDataToGeoJSON: function(featureObject, selectedEvent) {

    var relatedPlace = this.selectedPlaces.copy().find({
      'Short Name': {
        '$eq': selectedEvent.Place
      }
    }).data()[0];

    // If the event has no related place selected
    if (relatedPlace) {

      // Assign Geometry
      featureObject.geometry = this.getGeometryObject(relatedPlace);

      // Assign values
      featureObject.properties.placeName = relatedPlace['Full Name'];

      return featureObject;
    } else {
      return false;
    }
  },

  // Return a Geometry object based off the placeObject's
  getGeometryObject: function(placeObject) {

    var mapLocation = JSON.parse(placeObject['Map location']);

    var geometryObject = {
      coordinates: mapLocation
    };

    if (typeof mapLocation[0] === 'number') {
      geometryObject.type = 'Point';
    } else if (typeof mapLocation[0][0] === 'number') {
      geometryObject.type = 'LineString';
    } else if (typeof mapLocation[0][0][0] === 'number') {
      geometryObject.type = 'Polygon';
    }

    return geometryObject;
  },

  // Add Related People data to the geoJSON Object
  addRelatedPeopleDataToGeoJSON: function(featureObject) {

    return new Promise(function (resolve, reject) {

      resolve(featureObject);

    }.bind(this));
  }
});
