'use strict';

var config = require('../config/config.js');

var eventsObject = {
  filters: {
    type: 'find',
    value: {
      '$and': [
        {
          'Full Name': {
            // Bring back Full Name for Murder OR Kidnapping BUT NOT PersonA
            // '$regex': ['(?:(?:Murder)(?:[^PersonA]*))|(?:(?:Rape)(?:[^PersonA]*))', 'i']
            '$regex': ['', 'i']
          }
        },
        {
          'Type': {
            '$regex': ['', 'i']
          }
        },
        {
          'Begin Date and Time': {
            '$gte': '1900-01-01 00:00:00'
          }
        },
        {
          'End Date and Time': {
            '$lte': '2100-12-31 00:00:00'
          }
        }]
    }
  },
  sorting: {
    type: 'simplesort',
    property: '$loki',
    desc: true
  }
};

var placesObject = {
  filters: {
    type: 'find',
    value: {
      '$and': [
        {
          'Full Name': {
            '$regex' : ['', 'i']
          }
        },
        {
          'Type': {
            '$regex' : ['', 'i']
          }
        }]
    }
  },
  sorting: {
    type: 'simplesort',
    property: '$loki',
    desc: true
  }
};

var peopleObject = {
  filters: {
    type: 'find',
    value: {
      '$and': [
        {
          'Full Name': {
            '$regex' : ['', 'i']
          }
        },
        {
          'Gender': {
            '$regex' : ['', 'i']
          }
        }]
    }
  },
  sorting: {
    type: 'simplesort',
    property: '$loki',
    desc: true
  }
};

var sourcesObject = {
  filters: {
    type: 'find',
    value: {
      '$and': [
        {
          'Headline': {
            '$regex' : ['', 'i']
          }
        },
        {
          'Description': {
            '$regex' : ['', 'i']
          }
        }]
    }
  },
  sorting: {
    type: 'simplesort',
    property: '$loki',
    desc: true
  }
};

var filterTransforms = {};

filterTransforms[config.EventsCollection.name] = eventsObject;
filterTransforms[config.PlacesCollection.name] = placesObject;
filterTransforms[config.PeopleCollection.name] = peopleObject;
filterTransforms[config.SourcesCollection.name] = sourcesObject;

module.exports = filterTransforms;
