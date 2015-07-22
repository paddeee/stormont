'use strict';

var Reflux = require('reflux');
var TodoActions = require('./actions.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in TodoActions, using onKeyname (or keyname) as callbacks
  listenables: [TodoActions],

  onFileImported: function(flag) {

    var status = flag ? 'ONLINE' : 'OFFLINE';

    // Pass on to listeners
    this.trigger(status);
  }
});
