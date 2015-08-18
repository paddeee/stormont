'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var unique = require('lodash/array/uniq');
var ImportActions = require('../actions/import.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ImportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportActions],

  // When a CSV file has been selected by an Administrator
  onFileImported: function (action) {

    var collectionArray;
    var db;
    var dataCollection;

    // Parse the CSV into an array
    collectionArray = this.parseCSV(action.CSV);

    // Create In-Memory database
    db = new loki('Farrell');

    // Create a collection in the database
    dataCollection = this.addDBCollection(db, action);

    // Insert the array into the database collection
    this.populateCollection(collectionArray, dataCollection, action);
  },

  // Create an array of cellObjects which can be iterated through to return a dataCollection
  parseCSV: function (CSV) {

    var headingRow = 1;
    var cellArray;
    var dataCollection = [];
    var cellRow;
    var headingsHash = {};
    var sheet = CSV.Sheets[CSV.SheetNames[0]];

    // Create an array of cellObjects
    cellArray = this.createCellArray(sheet);

    // Iterate through each cell in cellArray
    cellArray.forEach(function (cellObject) {

      var cellIdentifier = Object.keys(cellObject)[0];
      var lettersPattern = /(\D+)/g;
      var cellLetterIdentifier;
      var dataRecord = {};

      // Letter part of the cellIdentifier, e.g A, B, AA
      cellLetterIdentifier = lettersPattern.exec(cellIdentifier)[0];

      // If the cell belongs to a new row, add the cellObject to the array
      if (cellRow != cellIdentifier.replace(/\D+/g, "")) {

        if (cellRow) {
          dataCollection.push(dataRecord);
        }
        cellRow = parseInt(cellIdentifier.replace(/\D+/g, ""), 10);
      }

      // If the cell comes from the row of headings, keep a record in the temporary headingsHash
      if (cellRow === headingRow) {

        headingsHash[cellLetterIdentifier] = cellObject[cellIdentifier].v;

      } else {

        // Using cellRow - 2 below because the index starts at 0 and we won't have pushed an object in the array for
        // headings
        dataRecord = dataCollection[cellRow - 2];
        dataRecord[headingsHash[cellLetterIdentifier]] = cellObject[cellIdentifier].v;
      }

    }, this);

    return dataCollection;
  },

  // Create an array of cellObjects which can be iterated through to generate our dataCollection
  createCellArray: function (sheet) {

    var cellArray = [];

    // For each cellName in a sheet, pass the letters of the cell name into the array
    for (var cellName in sheet) {
      cellArray = this.addCellToArray(sheet, cellName, cellArray);
    }

    return cellArray;
  },

  // Create a cellObject and add it to the cellArray if it is a valid data cell
  addCellToArray: function (sheet, cellName, cellArray) {

    var cellObject = {};

    if (cellName !== '!ref') {
      cellObject[cellName] = sheet[cellName];
      cellArray.push(cellObject);
    }

    return cellArray;
  },

  addDBCollection: function (db, action) {

    return db.addCollection(action.collectionName, {
      indices: this.getIndices(action.collectionName)
    });
  },

  getIndices: function (collectionName) {

    var indices = [];

    switch (collectionName) {
      case 'Places':
        indices.push('name');
        break;
      case 'People':
        indices.push('name');
        break;
      case 'Events':
        indices.push('name');
        break;
      default:
        break;
    }

    return indices;
  },

  populateCollection: function (collectionArray, dataCollection, action) {

    var peopleCollection = dataCollection.insert(collectionArray);

    console.log(dataCollection
      .chain()
      .find({'time-start':{'$gt': 959558399}})
      .data());

    // Pass on to listeners
    // this.trigger(doc);
  }
});
