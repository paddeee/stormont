/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

var reflux = require('reflux');
var CSVParser = require('./vendor/harb-customised.js');
var dataSourceActions = require('./actions/dataSource.js');
var filterStateActions = require('./actions/filterState.js');
var eventsStore = require('./stores/events.js');
var placesStore = require('./stores/places.js');
var peopleStore = require('./stores/people.js');
var sourceStore = require('./stores/source.js');
var userActions = require('./actions/users.js');
var userStore = require('./stores/users.js');
var importActions = require('./actions/import.js');
var importStore = require('./stores/import.js');

(function(document, reflux, filterStateActions, eventsStore, placesStore, peopleStore, sourceStore, dataSourceActions, importActions, importStore) {
  'use strict';

  // Call checkForLDAP action
  dataSourceActions.checkForLDAP();

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');

  // Set required modules as attributes on app
  app.reflux = reflux;
  app.CSVParser = CSVParser;
  app.dataSourceActions = dataSourceActions;
  app.userActions = userActions;
  app.userStore = userStore;
  app.importActions = importActions;
  app.importStore = importStore;
  app.filterStateActions = filterStateActions;
  app.eventsStore = eventsStore;
  app.placesStore = placesStore;
  app.peopleStore = peopleStore;
  app.sourceStore = sourceStore;
  app.packagedApp = global.packagedApp ? true : false;

  app.displayInstalledToast = function() {
    document.querySelector('#caching-complete').show();
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', function() {
    console.log('Operation Farrell content all added to page!');
    app.route = 'login';
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    // imports are loaded and elements have been registered

    // Set the correct path for leaflet images due to it breking with the build
    L.Icon.Default.imagePath = './images/leaflet/'
  });

  // Close drawer after menu item is selected if drawerPanel is narrow
  app.onMenuSelect = function() {
    var drawerPanel = document.querySelector('#paperDrawerPanel');
    if (drawerPanel.narrow) {
      drawerPanel.closeDrawer();
    }
  };

})(document, reflux, filterStateActions, eventsStore, placesStore, peopleStore, sourceStore, dataSourceActions, importActions, importStore);
