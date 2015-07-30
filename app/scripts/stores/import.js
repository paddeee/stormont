'use strict';

var Reflux = require('reflux');
var PouchDB = require('pouchdb');
var ImportActions = require('../actions/import.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in TodoActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportActions],

  // Import the workbook data into the database
  onFileImported: function(workbook) {
    this.updateDatabaseWithImport(workbook);
  },

  updateDatabaseWithImport: function(workbook) {

    console.log(workbook);

    var db = new PouchDB('farrell');

    this.updateDocumentWithImport(workbook, db);
  },

  updateDocumentWithImport: function(workbook, db) {

    db.get('sheets').then(function (doc) {

      console.log('got sheets');

      // Update Sheets part of database
      doc.sheets = workbook.Sheets;

      // put him back
      return db.put(doc);

    }).then(function () {

      // fetch farrell again
      return db.get('sheets');

    }).then((function (doc) {

      console.log(doc);

      console.log('updated document');

      // Pass on to listeners
      this.trigger(doc);

    }).bind(this)).catch((function () {

      this.createDocumentWithImport(workbook, db);

    }).bind(this));
  },

  createDocumentWithImport: function(workbook, db) {

    var document = {};

    document._id = 'sheets';
    document.sheets = workbook.Sheets;

    db.put(document);

    console.log('created document');

  }
});
