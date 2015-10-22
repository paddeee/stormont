'use strict';

var Reflux = require('reflux');
var dataSourceStore = require('../stores/dataSource.js');
var PresentationsActions = require('../actions/presentations.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in PresentationsActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [PresentationsActions],

  init: function() {

    // Set initial state user is using presentation
    this.presentationState = 'creating';

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
  },

  // When dataSource object has changed
  dataSourceChanged: function (dataSourceStore) {

    this.getPresentationData(dataSourceStore.dataSource);

    this.setMessage(dataSourceStore);

    this.trigger(this);
  },

  // Get the data from the Presentation Collection
  getPresentationData: function (dataSourceStore) {

    if (dataSourceStore.getCollection('Presentations')) {
      this.presentationsData = dataSourceStore.getCollection('Presentations').data;
    } else {
      return [];
    }
  },

  // Set the message copied form the dataSourceStore
  setMessage: function(dataSourceStore) {
    this.message = dataSourceStore.message;
  },

  // Set presentationState
  presentationStateChanged: function(presentationObject) {

    this.presentationState = presentationObject.presentationState;

    if (presentationObject.presentationName) {
      this.presentationName = presentationObject.presentationName;
    }

    // Send object out to all listeners when database loaded
    this.trigger(this);
  },

  // When a presentation has its approvalStateChanged
  approvalStateChanged: function(presentation) {

    // Update the model in the Presentations collection
    dataSourceStore.dataSource.getCollection('Presentations').update(presentation);

    // Save database
    dataSourceStore.dataSource.saveDatabase(function() {

      // Send object out to all listeners when database loaded
      this.trigger(this);

    }.bind(this));
  }
});
