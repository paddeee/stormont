'use strict';

var filterTransforms = {
  Events: {
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
          },
          {
            'Begin Date and Time': {
              '$gte' : '1900-01-01 00:00:00'
            }
          },
          {
            'End Date and Time': {
              '$lte' : '2100-12-31 00:00:00'
            }
          }]
      }
    },
    sorting: {
      type: 'simplesort',
      property: '$loki',
      desc: true
    }
  },
  Places: {
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
  },
  People: {
    filters: {
      type: 'find',
      textInputFilters: [
        'Full Name',
        'Type'
      ],
      datePickerFilters: [],
      value: {
        '$and': [
          {
            'Full Name': {
              '$regex' : ['', 'i']
            }
          },
          {
            'Ethnicity': {
              '$regex' : ['', 'i']
            }
          },
          {
            'Affiliation': {
              '$regex' : ['', 'i']
            }
          },
          {
            'Role In Case': {
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
  },
  Source: {
    filters: {
      type: 'find',
      textInputFilters: [
        'Full Name',
        'Type'
      ],
      datePickerFilters: [],
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
  }
};

module.exports = filterTransforms;
