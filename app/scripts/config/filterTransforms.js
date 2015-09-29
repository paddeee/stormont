'use strict';

var filterTransforms = {
  Events: {
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
              '$gte' : '1900-01-01'
            }
          },
          {
            'End Date and Time': {
              '$lte' : '2999-12-31'
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
    filters: {
      type: 'find',
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
