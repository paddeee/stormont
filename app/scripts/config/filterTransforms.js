'use strict';

var filterTransforms = {
  Events: {
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
  Places: {
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
  People: {
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
  Source: {
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
  }
};

module.exports = filterTransforms;
