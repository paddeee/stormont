'use strict';

var filterTransforms = {
  Events: {
    type: 'find',
    value: {
      'name': {
        '$regex' : new RegExp('', 'i')
      },
      'type': {
        '$regex' : new RegExp('', 'i')
      }
    }
  },
  Places: {
    type: 'find',
    value: {
      '$and': [
        {
          'name': {
            '$regex' : new RegExp('', 'i')
          }
        },
        {
          'type': {
            '$regex' : new RegExp('', 'i')
          }
        }]
    }
  },
  People: {
    type: 'find',
    value: {
      'name': {
        '$regex' : new RegExp('', 'i')
      },
      'type': {
        '$regex' : new RegExp('', 'i')
      }
    }
  },
  Source: {
    type: 'find',
    value: {
      'name': {
        '$regex' : new RegExp('', 'i')
      },
      'type': {
        '$regex' : new RegExp('', 'i')
      }
    }
  }
};

module.exports = filterTransforms;
