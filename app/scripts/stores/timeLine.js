'use strict';

var Reflux = require('reflux');
var config = presentationMode ? global.config : require('../config/config.js');
var selectedRecordsStore = require('../stores/selectedRecords.js');
var moment = require('moment');

module.exports = Reflux.createStore({

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(selectedRecordsStore, this.selectedRecordStoreUpdated);
  },

  // Triggered by updates to selectedRecords store
  selectedRecordStoreUpdated: function(selectedRecordStore) {

    // If selected records is changed
    if (selectedRecordStore.message.type === 'selectedRecordsUpdated') {

      this.createTimeLineJSON();

      // If event selected has changed
    } else if (selectedRecordStore.message.type === 'mapSelectedRecord') {

      this.activeEvent = selectedRecordStore.activeEvent;
      this.activePlace = selectedRecordStore.activePlace;

      this.message = {
        type: 'mapSelectedRecord'
      };

      this.trigger(this);

      // If event selected has changed
    } else if (selectedRecordStore.message.type === 'mapSelectedRecord') {

      this.activeEvent = selectedRecordStore.activeEvent;
      this.activePlace = selectedRecordStore.activePlace;

      this.message = {
        type: 'mapSelectedRecord'
      };

      this.trigger(this);
    }
  },

  // Create a TimeLine JSON Object that can be used by the Timeline to visualise data
  createTimeLineJSON: function() {

    var timeLineJSONObject;

    // Create an empty GeoJSON object
    var defaultTimeLineJSONObject = {
      'title': {
        'unique_id': '0',
        'text': {
          'headline': 'No Selected Events'
        }
      },
      'events': []
    };

    // Assign selected events from each store
    this.selectedEvents = selectedRecordsStore.selectedRecords[config.EventsCollection.name];

    // If no selected events
    if (!this.selectedEvents.data().length) {
      timeLineJSONObject = defaultTimeLineJSONObject;
    } else {

      // Push a feature object for each Event record
      this.selectedEvents.data().forEach(function(selectedEvent) {

        timeLineJSONObject = this.getTimeLineObject(selectedEvent, defaultTimeLineJSONObject);

      }.bind(this));
    }

    this.timeLineJSONObject = _.cloneDeep(timeLineJSONObject);

    this.message = {
      type: 'timeLineJSONCreated'
    };

    this.trigger(this);
  },

  // Return a TimeLine Object
  getTimeLineObject: function(selectedEvent, timeLineJSONObject) {

    var startDateName;
    var endDateName;

    // Get name of Field with a filter type of 'gte' and 'lte
    config.EventsCollection.fields.forEach(function(filter) {
      if (filter.filter === 'gte') {
        startDateName = filter.name;
      } else if (filter.filter === 'lte') {
        endDateName = filter.name;
      }
    }.bind(this));

    var timeLineObject = {
      'unique_id': selectedEvent.$loki.toString(),
      'start_date': {
        'year': moment(selectedEvent[startDateName]).format('YYYY'),
        'month': moment(selectedEvent[startDateName]).format('MM'),
        'day': moment(selectedEvent[startDateName]).format('DD'),
        'hour': moment(selectedEvent[startDateName]).format('HH'),
        'minute': moment(selectedEvent[startDateName]).format('mm'),
        'second': moment(selectedEvent[startDateName]).format('ss')
      },
      'text': {
        'headline': selectedEvent['Full Name'],
        'text': selectedEvent.Description
      },
      'media': {
        'url': this.getUrlFromCategory(selectedEvent.Type)
      }
    };

    // Set an end date object if one exists
    this.setEndDateObject(selectedEvent, endDateName, timeLineObject);

    // Push features onto the GeoJSON Object
    timeLineJSONObject.events.push(timeLineObject);

    return timeLineJSONObject;
  },

  // Set an end date object if one exists
  setEndDateObject: function(selectedEvent, endDateName, timeLineObject) {

    var endDateObject = {};

    if (selectedEvent[endDateName]) {
      endDateObject.year = moment(selectedEvent[endDateName]).format('YYYY');
      endDateObject.month = moment(selectedEvent[endDateName]).format('MM');
      endDateObject.day = moment(selectedEvent[endDateName]).format('DD');
      endDateObject.hour = moment(selectedEvent[endDateName]).format('HH');
      endDateObject.minute = moment(selectedEvent[endDateName]).format('mm');
      endDateObject.second = moment(selectedEvent[endDateName]).format('ss');

      timeLineObject.end_date = endDateObject;
    }
  },

  // Complete hack of TimeLine.js so don't have to change any TimeLine source code
  // Based on the event category return a mapped URL which TimeLine will use to add a class
  // to an event on the TimeLine. This can then be used to style an event according to
  // category
  getUrlFromCategory: function(category) {

    var url;
    var mainCategory;
    var categoryColour;

    config.Categories.sub.forEach(function(subCategory) {

      if (subCategory.name.toLowerCase() === category.toLowerCase()) {

        mainCategory = config.Categories.main.find(function(category) {
          return category.name.toLowerCase() === subCategory.category.toLowerCase();
        });

        categoryColour = mainCategory.colour;
      }
    });

    switch(categoryColour) {

      case 'red':
        url = 'twitter.com';
        break;

      case 'orange':
        url = 'wikipedia.org';
        break;

      case 'purple':
        url = 'flic.kr/';
        break;

      case 'darkgreen':
        url = 'dailymotion.com';
        break;

      case 'gray':
        url = 'vimeo.com';
        break;

      case 'cadetblue':
        url = 'vine.co';
        break;

      case 'darkpurple':
        url = 'soundcloud.com';
        break;

      case 'darkred':
        url = 'plus.google';
        break;

      case 'blue':
        url = 'documentcloud.org/';
        break;

      default:
        url = '//evidential.com';
    }

    return url;
  }
});
