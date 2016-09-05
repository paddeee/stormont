'use strict';

var config = {
  Categories: {
    main: [
      {
        name: 'Murder',
        colour: 'darkred'
      },
      {
        name: 'Kidnap',
        colour: 'purple'
      },
      {
        name: 'Arson',
        colour: 'orange'
      },
      {
        name: 'Rape',
        colour: 'darkgreen'
      },
      {
        name: 'Extortion',
        colour: 'cadetblue'
      },
      {
        name: 'Expulsion',
        colour: 'gray'
      },
      {
        name: 'Bombing',
        colour: 'darkpurple'
      },
      {
        name: 'Torture',
        colour: 'red'
      },
      {
        name: 'Robbery',
        colour: 'blue'
      }
    ],
    sub: [
      {
        name: 'category1',
        category: 'Murder',
        icon: 'adjust'
      },
      {
        name: 'category2',
        category: 'Murder',
        icon: 'area-chart'
      },
      {
        name: 'category3',
        category: 'Murder',
        icon: 'clock-o'
      },
      {
        name: 'category4',
        category: 'Murder',
        icon: 'plug'
      },
      {
        name: 'category5',
        category: 'Kidnap',
        icon: 'bank'
      },
      {
        name: 'category6',
        category: 'Kidnap',
        icon: 'beer'
      },
      {
        name: 'category7',
        category: 'Kidnap',
        icon: 'binoculars'
      },
      {
        name: 'category8',
        category: 'Kidnap',
        icon: 'bomb'
      },
      {
        name: 'category9',
        category: 'Arson',
        icon: 'home'
      },
      {
        name: 'category10',
        category: 'Arson',
        icon: 'building-o'
      },
      {
        name: 'category11',
        category: 'Arson',
        icon: 'cab'
      },
      {
        name: 'category12',
        category: 'Arson',
        icon: 'camera'
      },
      {
        name: 'category13',
        category: 'Rape',
        icon: 'child'
      },
      {
        name: 'category14',
        category: 'Rape',
        icon: 'cloud'
      },
      {
        name: 'category15',
        category: 'Rape',
        icon: 'fax'
      },
      {
        name: 'category16',
        category: 'Rape',
        icon: 'fire'
      },
      {
        name: 'category17',
        category: 'Extortion',
        icon: 'futbol-o'
      },
      {
        name: 'category18',
        category: 'Extortion',
        icon: 'gears'
      },
      {
        name: 'category19',
        category: 'Extortion',
        icon: 'hotel'
      },
      {
        name: 'category20',
        category: 'Expulsion',
        icon: 'industry'
      },
      {
        name: 'category21',
        category: 'Expulsion',
        icon: 'key'
      },
      {
        name: 'category22',
        category: 'Expulsion',
        icon: 'leaf'
      },
      {
        name: 'category23',
        category: 'Bombing',
        icon: 'university'
      },
      {
        name: 'category24',
        category: 'Bombing',
        icon: 'wheelchair'
      },
      {
        name: 'category25',
        category: 'Bombing',
        icon: 'tree'
      },
      {
        name: 'category26',
        category: 'Torture',
        icon: 'trophy'
      },
      {
        name: 'category27',
        category: 'Torture',
        icon: 'umbrella'
      },
      {
        name: 'category28',
        category: 'Torture',
        icon: 'wrench'
      },
      {
        name: 'category29',
        category: 'Torture',
        icon: 'truck'
      },
      {
        name: 'category30',
        category: 'Robbery',
        icon: 'suitcase'
      },
      {
        name: 'category31',
        category: 'Robbery',
        icon: 'rocket'
      },
      {
        name: 'category32',
        category: 'Robbery',
        icon: 'plane'
      },
      {
        name: 'category33',
        category: 'Robbery',
        icon: 'money'
      }
    ]
  },
  EventsCollection: {
    name: 'Event',
    fields: [{
      name: 'Full Name',
      displayName: 'Event Name',
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
      filterValues: ['category1', 'category2', 'category3', 'category4', 'category5', 'category6', 'category7', 'category8'],
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
      width: '180'
    },
    {
      name: 'End Date and Time',
      display: 'true',
      filter: 'lte',
      value: '2100-12-31 00:00:00',
      width: '180'
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
      displayName: 'Name',
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
      displayName: 'Place Name',
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
      displayName: 'Source Name',
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
  MapGeoJSONCollection: 'MapGeoJSON',
  RelatedItemCollection: 'Relateditem',
  activityTimeout: 120,
  mapMetricMeasurement: true
};

module.exports = config;
