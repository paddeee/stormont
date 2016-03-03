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

    var geoJSONObject;

    // Create an empty GeoJSON object
    var defaultGeoJSONObject = {
      'type': 'FeatureCollection',
      'features': []
    };

    // Assign selected events from each store
    this.selectedEvents = selectedRecordsStore.selectedRecords[config.EventsCollection.name];
    this.selectedPlaces = selectedRecordsStore.selectedRecords[config.PlacesCollection.name];
    this.selectedPeople = selectedRecordsStore.selectedRecords[config.PeopleCollection.name];
    this.selectedSources = selectedRecordsStore.selectedRecords[config.SourcesCollection.name];

    // If no selected events
    if (!this.selectedEvents.data().length) {
      geoJSONObject = defaultGeoJSONObject;
    } else {

      // Push a feature object for each Event record
      this.selectedEvents.data().forEach(function(selectedEvent) {

        geoJSONObject = this.getFeatureObject(selectedEvent, defaultGeoJSONObject);

      }.bind(this));
    }

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
        'relatedEvents': [],
        'relatedPeople': {
          suspects: [],
          victims: [],
          witnesses: []
        },
        'supportingEvidence': [{
          eventsEvidence: [],
          placeEvidence: []
        }]
      }
    };

    // Don't add to GeoJSON if no related place exists
    if (!this.addPlaceDataToGeoJSON(featureObject, selectedEvent)) {
      return geoJSONObject;
    }

    this.addRelatedEventsDataToGeoJSON(featureObject, selectedEvent);

    this.addRelatedPeopleDataToGeoJSON(featureObject, selectedEvent);

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

  // Add Related Events data to the geoJSON Object
  addRelatedEventsDataToGeoJSON: function(featureObject, selectedEvent) {

    var relatedEvents = selectedEvent['Linked events'].split(',');

    relatedEvents = _.map(relatedEvents, function(relatedEvent) {
      return relatedEvent.trim();
    });

    var eventDetails = this.selectedEvents.copy().find({
      'Short Name': {
        '$in': relatedEvents
      }
    }).data();

    eventDetails.forEach(function(eventObject) {

      var newEventObject = {
        id: eventObject.$loki,
        name: eventObject['Full Name'],
        description: eventObject['Description']
      };

      featureObject.properties.relatedEvents.push(newEventObject);
    });
  },

  // Add Related People data to the geoJSON Object
  addRelatedPeopleDataToGeoJSON: function(featureObject, selectedEvent) {

    var suspectsArray = selectedEvent.Suspects.split(',');
    var victimsArray = selectedEvent.Victims.split(',')
    var witnessesArray = selectedEvent.Witnesses.split(',');

    var trim = function (item) {
      return item.trim();
    };

    var relatedSuspects = _.map(suspectsArray, trim);
    var relatedVictims = _.map(victimsArray, trim);
    var relatedWitnesses = _.map(witnessesArray, trim);

    this.addRelatedPersonToArray(relatedSuspects, featureObject.properties.relatedPeople.suspects);
    this.addRelatedPersonToArray(relatedVictims, featureObject.properties.relatedPeople.victims);
    this.addRelatedPersonToArray(relatedWitnesses, featureObject.properties.relatedPeople.witnesses);
  },

  // Push a person Object onto the relevant array
  addRelatedPersonToArray: function(personArray, arrayToPushTo) {

    var personDetails = this.selectedPeople.copy().find({
      'Short Name': {
        '$in': personArray
      }
    }).data();

    personDetails.forEach(function(object) {

      var newObject = {
        id: object.$loki,
        name: object['Full Name'],
        description: object['Description']
      };

      arrayToPushTo.push(newObject);
    });
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
  }
});
