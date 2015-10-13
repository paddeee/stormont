'use strict';

var Reflux = require('reflux');
var PresentationsActions = require('../actions/presentations.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in PresentationsActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [PresentationsActions],

  init: function() {
    this.presentationState = 'creating';
  },

  // Set presentationState
  presentationStateChanged: function(presentationState) {

    console.log(presentationState);

    // Send object out to all listeners when database loaded
    this.trigger(this);
  }
});
