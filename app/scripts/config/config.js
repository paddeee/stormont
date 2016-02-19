'use strict';

var config = {
  EventsCollection: {
    name: 'Event',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Short Name',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Type',
      display: 'true',
      filter: 'select',
      filterValues: ['Murder', 'Arson', 'Kidnap']
    },
    {
      name: 'Linked events',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Suspects',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Victims',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Witnesses',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Place',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Begin Date and Time',
      display: 'true',
      filter: 'gte'
    },
    {
      name: 'End Date and Time',
      display: 'true',
      filter: 'lte'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Indictment Reference',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Supporting Documents',
      display: 'true',
      filter: 'regex'
    }]
  },
  PeopleCollection: {
    name: 'Person',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Short Name',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Gender',
      display: 'true',
      filter: 'select',
      filterValues: ['Male', 'Female']
    },
    {
      name: 'Date of birth',
      display: 'true',
      filter: 'gte'
    },
    {
      name: 'Date of death',
      display: 'true',
      filter: 'lte'
    },
    {
      name: 'Ethnicity',
      display: 'true',
      filterValues: ['White', 'Black', 'Asian']
    },
    {
      name: 'Affiliation',
      display: 'true',
      filterValues: ['Army Unit', 'Other']
    },
    {
      name: 'Linked persons',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Picture',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Supporting Documents',
      display: 'true',
      filter: 'regex'
    }]
  },
  PlacesCollection: {
    name: 'Place',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Short Name',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Type',
      display: 'true',
      filter: 'select',
      filterValues: ['Church', 'School', 'Army base', 'Point of interest']
    },
    {
      name: 'AOR_KFOR',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'AOR_KLA',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'AOR_Kumanovo',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Country',
      display: 'true',
      filter: 'select',
      filterValues: ['Kosovo', 'Serbia', 'Bosnia']
    },
    {
      name: 'Region',
      display: 'true',
      filter: 'select',
      filterValues: ['North', 'South', 'East', 'West']
    },
    {
      name: 'Municipality',
      display: 'true',
      filter: 'select',
      filterValues: ['Municipality1', 'Municipality2', 'Municipality3', 'Municipality4']
    },
    {
      name: 'Map location',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Time Range Start',
      display: 'true',
      filter: 'gte'
    },
    {
      name: 'Time Range End',
      display: 'true',
      filter: 'lte'
    },
    { name: 'Supporting Documents',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex'
    }]
  },
  SourcesCollection: {
    name: 'Document',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Short Name',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Pre-exhibit No',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Trial Ex. #',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Related items',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Linked File',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Language',
      display: 'true',
      filter: 'regex'
    },
    {
      name: 'Approved for release',
      display: 'false',
      filter: 'none'
    }]
  },
  QueriesCollection: 'Queries',
  MapGeoJSONCollection: 'MapGeoJSON'
};

module.exports = config;
