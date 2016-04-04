'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var ImportActions = require('../actions/import.js');
var DataSourceActions = require('../actions/dataSource.js');
var dataSourceStore = require('../stores/dataSource.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ImportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportActions, DataSourceActions],

  init: function() {
    this.eventsSchemaFields = [];
    this.placesSchemaFields = [];
    this.peopleSchemaFields = [];
    this.sourcesSchemaFields = [];
    this.errorArray = [];
  },

  // Create arrays based on fields in schema to validate imported files
  createSchemaArrays: function() {

    // Events
    config.EventsCollection.fields.forEach(function(object) {
      this.eventsSchemaFields.push(object.name);
    }.bind(this));

    // Places
    config.PlacesCollection.fields.forEach(function(object) {
      this.placesSchemaFields.push(object.name);
    }.bind(this));

    // People
    config.PeopleCollection.fields.forEach(function(object) {
      this.peopleSchemaFields.push(object.name);
    }.bind(this));

    // Sources
    config.SourcesCollection.fields.forEach(function(object) {
      this.sourcesSchemaFields.push(object.name);
    }.bind(this));
  },

  // When a CSV file has been selected by an Administrator
  importFile: function (fileObject) {

    var parsedFile;
    var dataSource = dataSourceStore.dataSource;
    var dataCollection = dataSource.getCollection(fileObject.collectionName);

    // Parse the CSV into an array
    parsedFile = this.parseCSV(fileObject);

    // If file import failed
    if (!(parsedFile instanceof Array)) {
      return parsedFile;
    }

    // Create/Update a collection in the database
    if (dataCollection) {
      dataCollection.clear();
    } else {
      dataCollection = this.addDBCollection(dataSource, fileObject);
    }

    // Insert the array into the database collection
    this.populateCollection(parsedFile, dataCollection, fileObject.collectionName);

    dataSource.message = {
      type: 'collectionImported',
      collectionName: fileObject.collectionName
    };

    // Call collectionImported method on DataSource store
    dataSourceStore.collectionImported(dataSource);

    return true;
  },

  // When a bunch of data files have been imported by an Administrator
  onFilesImported: function (filesArray) {

    var dataSource = dataSourceStore.dataSource;

    this.createSchemaArrays();

    // If any files failed set flag so we don't save the database
    filesArray.forEach(function(fileObject) {

      var importFile = this.importFile(fileObject);

      if (typeof importFile !== 'boolean') {
        this.errorArray.push(importFile);
      }
    }.bind(this));

    // If any file import has failed send array of fail objects
    if (this.errorArray.length) {
      this.trigger(this.errorArray);
      this.errorArray = [];
      return;
    }

    // Replace shortNames in description field of Event collection
    this.replaceShortnames(dataSource);

    // Save database
    dataSource.saveDatabase(function() {
      console.log('DataBase saved');

      // Pass on to listeners
      this.trigger({
        type: 'success',
        title: 'Import Successful',
        message: 'All files have been successfully imported'
      });
    }.bind(this));
  },

  // Find and Replace by a dictionary
  replaceShortnames: function(dataSource) {

    var shortNameDictionary = {};
    var eventData = dataSource.getCollection(config.EventsCollection.name).data;
    var placeData = dataSource.getCollection(config.PlacesCollection.name).data;
    var personData = dataSource.getCollection(config.PeopleCollection.name).data;

    shortNameDictionary = this.addToShortnameDictionary(shortNameDictionary, eventData);
    shortNameDictionary = this.addToShortnameDictionary(shortNameDictionary, placeData);
    shortNameDictionary = this.addToShortnameDictionary(shortNameDictionary, personData);

    eventData.forEach(function(event) {

      event.Description = this.replaceUsingDictionary(shortNameDictionary, event.Description, function(key, shortNameDictionary) {
        return shortNameDictionary[key];
        //return '<span class="replaced">' + shortNameDictionary[key] + '</span>';
      });
    }.bind(this));
  },

  // Return a dictionary of Shortname/Full Name pairs from a collection
  addToShortnameDictionary: function(shortNameDictionary, collection) {

    collection.forEach(function(record) {
      shortNameDictionary[record['Short Name']] = record['Full Name'];
    });

    return shortNameDictionary;
  },

  // Replaces phrases in a string, based on keys in a given dictionary
  replaceUsingDictionary: function(dictionary, content, replacehandler) {

    var patterns = [];
    var patternHash = {};
    var oldkey;
    var key;
    var index = 0;
    var output = [];
    var pattern;
    var lastIndex;

    if (typeof replacehandler != "function") {

      // Default replacehandler function.
      replacehandler = function(key, dictionary) {
        return dictionary[key];
      }
    }

    for (key in dictionary) {

      // Case-insensitivity:
      key = (oldkey = key).toLowerCase();
      dictionary[key] = dictionary[oldkey];

      // Sanitize the key, and push it in the list
      patterns.push('\\b(?:' + key.replace(/([[^$.|?*+(){}])/g, '\\$1') + ')\\b');

      // Add entry to hash variable, for an optimized backtracking at the next loop
      patternHash[key] = index++;
    }

    pattern = new RegExp(patterns.join('|'), 'gi');
    lastIndex = 0;

    // We should actually test using !== null, but for foolproofness,
    // we also reject empty strings
    while (key = pattern.exec(content)) {

      // Case-insensitivity
      key = key[0].toLowerCase();

      // Add to output buffer
      output.push(content.substring(lastIndex, pattern.lastIndex - key.length));

      // The next line is the actual replacement method
      output.push(replacehandler(key, dictionary));

      // Update lastIndex variable
      lastIndex = pattern.lastIndex;

      // IMPORTANT: Update lastIndex property. Otherwise, enjoy an infinite loop
      pattern.lastIndex = lastIndex;
    }
    output.push(content.substring(lastIndex, content.length));
    return output.join('');
  },

  // Create an array of cellObjects which can be iterated through to return a dataCollection
  parseCSV: function (fileObject) {

    var headingRow = 1;
    var collectionName = fileObject.collectionName;
    var cellArray;
    var dataCollection = [];
    var cellRow;
    var headingsHash = {};
    var sheet = fileObject.CSV.Sheets[fileObject.CSV.SheetNames[0]];
    var fileInvalid;

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

        if (this.validateFieldName(collectionName, cellObject[cellIdentifier].v)) {
          headingsHash[cellLetterIdentifier] = cellObject[cellIdentifier].v;
        } else {
          fileInvalid = {
            type: 'collectionFailed',
            collectionName: fileObject.collectionName,
            message: 'Field Name "' + cellObject[cellIdentifier].v + '" does not match the "' + collectionName + '" schema in the config file.'
          };
        }

      } else {

        // Using cellRow - 2 below because the index starts at 0 and we won't have pushed an object in the array for
        // headings
        dataRecord = dataCollection[cellRow - 2];
        dataRecord[headingsHash[cellLetterIdentifier]] = cellObject[cellIdentifier].v;

        // Set all record's 'showRecord' and 'disabled' properties to false by default
        dataRecord.selectedByEvent = false;
        dataRecord.showRecord = false;
      }

    }.bind(this));

    if (fileInvalid) {
      return fileInvalid;
    } else {
      return dataCollection;
    }
  },

  // Validate the incoming fieldName for a collection exists in the schema
  validateFieldName: function (collectionName, fieldName) {

    var validFieldName = false;

    switch (collectionName) {
      case config.EventsCollection.name:
        if (_.indexOf(this.eventsSchemaFields, fieldName) !== -1) {
          validFieldName = true;
        }
        break;
      case config.PlacesCollection.name:
        if (_.indexOf(this.placesSchemaFields, fieldName) !== -1) {
          validFieldName = true;
        }
        break;
      case config.PeopleCollection.name:
        if (_.indexOf(this.peopleSchemaFields, fieldName) !== -1) {
          validFieldName = true;
        }
        break;
      case config.SourcesCollection.name:
        if (_.indexOf(this.sourcesSchemaFields, fieldName) !== -1) {
          validFieldName = true;
        }
        break;
      default:
        validFieldName = true;
    }

    return validFieldName;
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
      case config.PlacesCollection.name:
        indices.push('Full Name');
        break;
      case config.PeopleCollection.name:
        indices.push('Full Name');
        break;
      case config.EventsCollection.name:
        indices.push('Full Name');
        break;
      case config.SourcesCollection.name:
        indices.push('Full Name');
        break;
      default:
        break;
    }

    return indices;
  },

  // Populate the Loki collection with our array of data
  populateCollection: function (collectionArray, dataCollection, collectionName) {

    // Pass on to listeners
    this.trigger({
      type: 'fileImported',
      title: 'File Import Successful',
      message: collectionName
    });

    dataCollection.insert(collectionArray);
  }
});
