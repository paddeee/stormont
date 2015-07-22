'use strict';

var Reflux = require('reflux');
var ImportActions = require('../actions/import.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in TodoActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportActions],

  onFileImported: function(flag) {

    var status = flag ? 'Imported!' : 'Not imported';

    // Pass on to listeners
    this.trigger(status);
  }
});
