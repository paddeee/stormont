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
              '$regex' : new RegExp('', 'i')
            }
          },
          {
            'Type': {
              '$regex' : new RegExp('', 'i')
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
              '$regex' : new RegExp('', 'i')
            }
          },
          {
            'Type': {
              '$regex' : new RegExp('', 'i')
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
              '$regex' : new RegExp('', 'i')
            }
          },
          {
            'Ethnicity': {
              '$regex' : new RegExp('', 'i')
            }
          },
          {
            'Affiliation': {
              '$regex' : new RegExp('', 'i')
            }
          },
          {
            'Role In Case': {
              '$regex' : new RegExp('', 'i')
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
              '$regex': new RegExp('', 'i')
            }
          },
          {
            'Type': {
              '$regex': new RegExp('', 'i')
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
