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

  // Set presentationState
  presentationStateChanged: function(presentationState) {

    console.log(presentationState);

    // Send object out to all listeners when database loaded
    this.trigger(this);
  }
});
