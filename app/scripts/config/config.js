'use strict';

var config = {
  EventsCollection: {
    name: 'Event',
    fields: {
      'Full Name': {
        display: true,
        filter: 'regex'
      },
      'Shortname': {
        display: false,
        filter: 'none'
      },
      'Type': {
        display: true,
        filter: 'select',
        filterValues: ['Murder', 'Arson', 'Kidnap']
      },
      'Linked Events': {
        display: true,
        filter: 'regex'
      },
      'Suspects': {
        display: true,
        filter: 'regex'
      },
      'Victims': {
        display: true,
        filter: 'regex'
      },
      'Witnesses': {
        display: true,
        filter: 'regex'
      },
      'Place': {
        display: true,
        filter: 'regex'
      },
      'Begin Date and Time': {
        display: true,
        filter: 'gte'
      },
      'End Date and Time': {
        display: true,
        filter: 'lte'
      },
      'Description': {
        display: true,
        filter: 'regex'
      },
      'Indictment Reference': {
        display: true,
        filter: 'regex'
      },
      'Supporting documents': {
        display: true,
        filter: 'regex'
      }
    }
  },
  PeopleCollection: {
    name: 'Person',
    fields: {
      'Full Name': {
        display: true,
        filter: 'regex'
      },
      'Shortname': {
        display: false,
        filter: 'none'
      },
      'Gender': {
        display: true,
        filter: 'select',
        filterValues: ['Male', 'Female']
      },
      'Date of birth': {
        display: true,
        filter: 'gte'
      },
      'Date of death': {
        display: true,
        filter: 'lte'
      },
      'Ethnicity': {
        display: true,
        filterValues: ['White', 'Black', 'Asian']
      },
      'Affiliation': {
        display: true,
        filterValues: ['Army Unit', 'Other']
      },
      'Linked persons': {
        display: true,
        filter: 'regex'
      },
      'Description': {
        display: true,
        filter: 'regex'
      },
      'Picture': {
        display: false,
        filter: 'none'
      },
      'Supporting documents': {
        display: true,
        filter: 'regex'
      }
    }
  },
  PlacesCollection: {
    name: 'Place',
    fields: {
      'Full Name': {
        display: true,
        filter: 'regex'
      },
      'Shortname': {
        display: false,
        filter: 'none'
      },
      'Type': {
        display: true,
        filter: 'select',
        filterValues: ['Church', 'School', 'Army base', 'Point of interest']
      },
      'Country': {
        display: true,
        filter: 'select',
        filterValues: ['Kosovo', 'Serbia', 'Bosnia']
      },
      'Region': {
        display: true,
        filter: 'select',
        filterValues: ['North', 'South', 'East', 'West']
      },
      'Municipality': {
        display: true,
        filter: 'select',
        filterValues: ['Municipality1', 'Municipality2', 'Municipality3', 'Municipality4']
      },
      'AOR_KLA': {
        display: true,
        filter: 'regex'
      },
      'AOR_KFOR': {
        display: true,
        filter: 'regex'
      },
      'AOR_Kumanovo': {
        display: true,
        filter: 'regex'
      },
      'Map location': {
        display: false,
        filter: 'none'
      },
      'Time range start': {
        display: true,
        filter: 'gte'
      },
      'Time range end': {
        display: true,
        filter: 'lte'
      },
      'Description': {
        display: true,
        filter: 'regex'
      },
      'Supporting documents': {
        display: true,
        filter: 'regex'
      }
    }
  },
  SourcesCollection: {
    name: 'Sources',
    fields: {
      'Full Name': {
        display: true,
        filter: 'regex'
      },
      'Shortname': {
        display: false,
        filter: 'none'
      },
      'Description': {
        display: true,
        filter: 'regex'
      },
      'Pre-exhibit No': {
        display: false,
        filter: 'none'
      },
      'Trial Ex. #': {
        display: false,
        filter: 'none'
      },
      'Related items': {
        display: false,
        filter: 'none'
      },
      'Linked File': {
        display: false,
        filter: 'none'
      },
      'Language': {
        display: true,
        filter: 'regex'
      },
      'Approved for release': {
        display: false,
        filter: 'none'
      }
    }
  },
  MapGeoJSONCollection: 'MapGeoJSON'
};

module.exports = config;
