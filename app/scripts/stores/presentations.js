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

    // Create selected presentation object
    this.selectedPresentationObject = {};

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
  },

  // When dataSource object has changed
  dataSourceChanged: function (dataSourceStore) {

    this.lastAction = 'dataSourceChanged';

    this.getPresentationData(dataSourceStore.dataSource);

    this.setMessage(dataSourceStore);

    this.trigger(this);

    // Reset message
    this.message = '';
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

    var presentationCollection = dataSourceStore.dataSource.getCollection('Presentations');
    var selectedPresentationObject;

    this.lastAction = 'presentationStateChanged';

    // Get Presentation Object if it exists
    if (presentationCollection) {
      selectedPresentationObject = presentationCollection.find({
        'presentationName': presentationObject.presentationName
      });
    }

    if (selectedPresentationObject && selectedPresentationObject.length > 0) {
      this.selectedPresentationObject = selectedPresentationObject[0];
    } else {
      this.selectedPresentationObject = {};
    }

    this.presentationState = presentationObject.presentationState;

    if (presentationObject.presentationName) {
      this.presentationName = presentationObject.presentationName;
    }

    // Send object out to all listeners when presentation state changed
    this.trigger(this);
  },

  // When a presentation has its approvalStateChanged
  approvalStateChanged: function(presentation) {

    this.lastAction = 'approvalStateChanged';

    // Update the model in the Presentations collection
    dataSourceStore.dataSource.getCollection('Presentations').update(presentation);

    // Save database
    dataSourceStore.dataSource.saveDatabase(function() {

      // Send object out to all listeners when database loaded
      this.trigger(this);

    }.bind(this));
  },

  // Add an 'unapprovedSource' property to each presentation that contains unapproved Source Material
  flagUnapprovedSources: function(userFilteredCollection) {

    var unapprovedSource = false;

    // If any sources are not approved for release change the flag
    userFilteredCollection.data().forEach(function(source) {

      if (source['Approved for release'] === 'No') {
        unapprovedSource = true;
      }
    });

    this.selectedPresentationObject.unapprovedSource = unapprovedSource;
  }
});
