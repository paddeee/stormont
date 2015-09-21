'use strict';

var Reflux = require('reflux');
var ImportActions = require('../actions/import.js');
var dataSourceStore = require('../stores/dataSource.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ImportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportActions],

  // When a CSV file has been selected by an Administrator
  onFileImported: function (fileObject) {

    var collectionArray;
    var dataSource = dataSourceStore.dataSource;
    var dataCollection = dataSource.getCollection(fileObject.collectionName);

    // Parse the CSV into an array
    collectionArray = this.parseCSV(fileObject.CSV);

    // Create/Update a collection in the database
    //if (this.collectionExists(dataSource, fileObject.collectionName)) {
    if (dataCollection) {
      dataCollection.clear();
    } else {
      dataCollection = this.addDBCollection(dataSource, fileObject);
    }

    // Insert the array into the database collection
    this.populateCollection(collectionArray, dataCollection, fileObject.collectionName);

    // Save database
    dataSource.saveDatabase();
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
      if (cellRow !== parseInt(cellIdentifier.replace(/\D+/g, ''), 10)) {

        if (cellRow) {
          dataCollection.push(dataRecord);
        }
        cellRow = parseInt(cellIdentifier.replace(/\D+/g, ''), 10);
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

  // Return true if a collection of this name already exists in the dataSource
  /*collectionExists: function (dataSource, collectionName) {

    var collections = dataSource.listCollections();
    var collectionExists = false;

    collections.forEach(function(collection) {
      if (collection.name === collectionName) {
        collectionExists = true;
      }
    });

    return collectionExists;
  },*/

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

  // Add a collection to a Loki database
  addDBCollection: function (db, fileObject) {

    return db.addCollection(fileObject.collectionName, {
      indices: this.getIndices(fileObject.collectionName)
    });
  },

  // Based on which collection has been imported, return an array of indices
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

  // Populate the Loki collection with our array of data
  populateCollection: function (collectionArray, dataCollection, collectionName) {

    dataCollection.insert(collectionArray);

    /* Example Usage

    dataCollection
     .chain()
     .find({'age':{'$gt': 25}})
     .where(function(obj){ return obj.name.indexOf("in") != -1 })
     .simplesort("age")
     .offset(50)
     .limit(10)
     .data();
     */

    // Pass on to listeners
    this.trigger({
      type: 'success',
      title: 'Import Successful',
      message: collectionName + ' CSV has been successfully imported'
    });
  }
});
