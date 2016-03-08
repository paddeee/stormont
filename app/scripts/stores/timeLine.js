'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var selectedRecordsStore = require('../stores/selectedRecords.js');
var moment = require('moment');

module.exports = Reflux.createStore({

  // Called on Store initialisation
  init: function() {

    // Register dataSourceStores's changes
    this.listenTo(selectedRecordsStore, this.createTimeLineJSON);
  },

  // Create a TimeLine JSON Object that can be used by the Timeline to visualise data
  createTimeLineJSON: function(selectedRecordsStore) {

    var timeLineJSONObject;

    if (selectedRecordsStore.message.type === 'timeLineSelectedRecord') {
      return;
    }

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

    this.trigger(timeLineJSONObject);
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
        'hour': moment(selectedEvent[startDateName]).format("HH"),
        'minute': moment(selectedEvent[startDateName]).format("mm"),
        'second': moment(selectedEvent[startDateName]).format("ss")
      },
      "text": {
        "headline": selectedEvent['Full Name'],
        "text": selectedEvent['Description']
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
  }
});
