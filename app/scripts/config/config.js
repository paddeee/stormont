'use strict';

var config = {
  EventsCollection: {
    name: 'Event',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex',
      width: '400'
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
      filterValues: ['Murder', 'Arson', 'Kidnap'],
      width: '120'
    },
    {
      name: 'Linked events',
      display: 'true',
      filter: 'regex',
      width: '400'
    },
    {
      name: 'Suspects',
      display: 'true',
      filter: 'regex',
      width: '200'
    },
    {
      name: 'Victims',
      display: 'true',
      filter: 'regex',
      width: '200'
    },
    {
      name: 'Witnesses',
      display: 'true',
      filter: 'regex',
      width: '200'
    },
    {
      name: 'Place',
      display: 'true',
      filter: 'regex',
      width: '150'
    },
    {
      name: 'Begin Date and Time',
      display: 'true',
      filter: 'gte',
      value: '1900-01-01 00:00:00',
      width: '150'
    },
    {
      name: 'End Date and Time',
      display: 'true',
      filter: 'lte',
      value: '2100-12-31 00:00:00',
      width: '150'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex',
      width: '2000'
    },
    {
      name: 'Indictment Reference',
      display: 'true',
      filter: 'regex',
      width: '120'
    },
    {
      name: 'Supporting Documents',
      display: 'true',
      filter: 'regex',
      width: '150'
    }]
  },
  PeopleCollection: {
    name: 'Person',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex',
      width: '200'
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
      filterValues: ['Male', 'Female'],
      width: '120'
    },
    {
      name: 'Date of birth',
      display: 'true',
      filter: 'gte',
      value: '1900-01-01 00:00:00',
      width: '170'
    },
    {
      name: 'Date of death',
      display: 'true',
      filter: 'lte',
      value: '2100-12-31 00:00:00',
      width: '170'
    },
    {
      name: 'Ethnicity',
      display: 'true',
      filter: 'select',
      filterValues: ['White', 'Black', 'Asian'],
      width: '120'
    },
    {
      name: 'Affiliation',
      display: 'true',
      filter: 'select',
      filterValues: ['Army Unit', 'Other'],
      width: '120'
    },
    {
      name: 'Linked persons',
      display: 'true',
      filter: 'regex',
      width: '400'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex',
      width: '1000'
    },
    {
      name: 'Photo',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Profile',
      display: 'true',
      filter: 'regex',
      width: '120'
    },
    {
      name: 'Supporting Documents',
      display: 'true',
      filter: 'regex',
      width: '200'
    }]
  },
  PlacesCollection: {
    name: 'Place',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex',
      width: '200'
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
      filterValues: ['Church', 'School', 'Army base', 'Point of interest'],
      width: '150'
    },
    {
      name: 'AOR_KFOR',
      display: 'true',
      filter: 'regex',
      width: '100'
    },
    {
      name: 'AOR_KLA',
      display: 'true',
      filter: 'regex',
      width: '100'
    },
    {
      name: 'AOR_Kumanovo',
      display: 'true',
      filter: 'regex',
      width: '100'
    },
    {
      name: 'Country',
      display: 'true',
      filter: 'select',
      filterValues: ['Kosovo', 'Serbia', 'Bosnia'],
      width: '150'
    },
    {
      name: 'Region',
      display: 'true',
      filter: 'select',
      filterValues: ['North', 'South', 'East', 'West'],
      width: '120'
    },
    {
      name: 'Municipality',
      display: 'true',
      filter: 'select',
      filterValues: ['Municipality1', 'Municipality2', 'Municipality3', 'Municipality4'],
      width: '120'
    },
    {
      name: 'Map location',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Time Range Start',
      display: 'true',
      filter: 'gte',
      value: '1900-01-01 00:00:00',
      width: '150'
    },
    {
      name: 'Time Range End',
      display: 'true',
      filter: 'lte',
      value: '2100-12-31 00:00:00',
      width: '150'
    },
    { name: 'Supporting Documents',
      display: 'true',
      filter: 'regex',
      width: '200'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex',
      width: '1000'
    }]
  },
  SourcesCollection: {
    name: 'Document',
    fields: [{
      name: 'Full Name',
      display: 'true',
      filter: 'regex',
      width: '200'
    },
    {
      name: 'Short Name',
      display: 'false',
      filter: 'none'
    },
    {
      name: 'Description',
      display: 'true',
      filter: 'regex',
      width: '400'
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
      filter: 'regex',
      width: '100'
    },
    {
      name: 'Approved for release',
      display: 'true',
      filter: 'none',
      width: '100'
    }]
  },
  PresentationsCollection: 'Presentations',
  QueriesCollection: 'Queries',
  MapGeoJSONCollection: 'MapGeoJSON'
};

module.exports = config;
