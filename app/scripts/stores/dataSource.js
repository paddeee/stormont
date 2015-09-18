'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var fileAdapter = require('../adapters/loki-file-adapter.js');
var DataSourceActions = require('../actions/dataSource.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in DataSourceActions, using onKeyname (or keyname) as callbacks
  listenables: [DataSourceActions],

  // The Loki db object
  dataSource: null,

  // When a user has attempted login
  checkForLDAP: function () {

    if (this.LDAPExists()) {

      this.dataSource = new loki('farrell.json', {
        adapter: fileAdapter
      });

      // Send object out to all listeners
      this.trigger(this.dataSource);
    }
  },

  // Can we establish an LDAP connection
  // ToDo: Need to manage LDAP connectivity checks from here. For now, just return true
  LDAPExists: function() {
    return true;
  }
});
