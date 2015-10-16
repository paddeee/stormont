'use strict';

var filterTransforms = {
  Events: {
    filtersToShow: {
      textInputFilters: [
        'Full Name',
        'Type'
      ],
      datePickerFilters: [
        {
          defaultDate: '1900-01-01',
          defaultTime: '00:00:00',
          queryType: '$gte',
          name: 'Begin Date and Time'
        },
        {
          defaultDate: '2100-12-31',
          defaultTime: '00:00:00',
          queryType: '$lte',
          name: 'End Date and Time'
        }
      ]
    },
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
    filtersToShow: {
      textInputFilters: [
        'Full Name',
        'Type'
      ],
      datePickerFilters: []
    },
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
    filtersToShow: {
      textInputFilters: [
        'Full Name',
        'Type'
      ],
      datePickerFilters: []
    },
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
    filtersToShow: {
      textInputFilters: [
        'Full Name',
        'Type'
      ],
      datePickerFilters: []
    },
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
