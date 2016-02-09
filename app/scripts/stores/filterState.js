'use strict';

var Reflux = require('reflux');
var config = require('../config/config.js');
var filterTransforms = require('../config/filterTransforms.js');
var FilterStateActions = require('../actions/filterState.js');
var dataSourceStore = require('../stores/dataSource.js');
var eventsStore = require('../stores/events.js');
var placesStore = require('../stores/places.js');
var peopleStore = require('../stores/people.js');
var sourcesStore = require('../stores/source.js');

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in FilterStateActions,
  // using onKeyname (or keyname) as callbacks
  listenables: [FilterStateActions],

  init: function () {
    this.transformName = 'ViewingFilter';

    // Arrays to keep track of selected related documents in each data store
    this.selectedEventDocuments = [];
    this.selectedPeopleDocuments = [];
    this.selectedPlaceDocuments = [];

    // Register dataSourceStores's changes
    this.listenTo(dataSourceStore, this.dataSourceChanged);
  },

  // Set the filteredData Object
  dataSourceChanged: function () {

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollections
    // method
    this.autoFilterCollections(false, false);
  },

  // Set search filter on our collectionTransform
  searchFilterChanged: function (searchFilterObject) {

    this.updateFilteredData(searchFilterObject);

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollections
    // method
    this.autoFilterCollections(true, false);
  },

  // Set simpleSort on our collectionTransform
  sortingChanged: function (sortingObject) {

    this.updateSortedData(sortingObject);

    // When the userFilteredCollection has been created on each data store, we can call the autoFilterCollections
    // method
    this.autoFilterCollections(false, false);
  },

  // Update filtered data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateFilteredData: function (searchFilterObject) {

    switch (searchFilterObject.collectionName) {
      case config.EventsCollection:
        filterTransforms[config.EventsCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      case config.PlacesCollection:
        filterTransforms[config.PlacesCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      case config.PeopleCollection:
        filterTransforms[config.PeopleCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      case config.SourcesCollection:
        filterTransforms[config.SourcesCollection].filters = this.createFilterObject(searchFilterObject);
        break;
      default:
        console.error('No collection Name');
    }
  },

  // Update sorted data based on the collection
  // ToDo: Need to make this dynamic based on passed in fields
  updateSortedData: function (sortingObject) {

    switch (sortingObject.collectionName) {
      case config.EventsCollection:
        filterTransforms[config.EventsCollection].sorting = this.createSortingObject(sortingObject);
        break;
      case config.PlacesCollection:
        filterTransforms[config.PlacesCollection].sorting = this.createSortingObject(sortingObject);
        break;
      case config.PeopleCollection:
        filterTransforms[config.PeopleCollection].sorting = this.createSortingObject(sortingObject);
        break;
      case config.SourcesCollection:
        filterTransforms[config.SourcesCollection].sorting = this.createSortingObject(sortingObject);
        break;
      default:
        console.error('No collection Name');
    }
  },

  // Create a filter transform object from a filter Object
  createFilterObject: function (searchFilterObject) {

    var transform = {
      type: 'find',
      value: {
        $and: []
      }
    };

    searchFilterObject.fields.forEach(function (field) {

      var fieldObject = {};
      var queryObject = {};

      if (field.queryType !== 'regex') {
        queryObject[field.queryType] = field.value;
      } else {
        queryObject.$regex = [field.value, 'i'];
      }

      fieldObject[field.name] = queryObject;

      transform.value.$and.push(fieldObject);
    });

    return transform;
  },

  // Create a sorting transform object from a sorting Object
  createSortingObject: function (sortingObject) {

    var transform = {
      type: 'simplesort',
      property: sortingObject.fieldName,
      desc: sortingObject.desc
    };

    return transform;
  },

  // Triggered when a package is chosen to be viewed or edited
  packageSelected: function (presentationName) {

    // Call filterStateChanged on each data store
    eventsStore.filterStateChanged(presentationName);
    placesStore.filterStateChanged(presentationName);
    peopleStore.filterStateChanged(presentationName);
    sourcesStore.filterStateChanged(presentationName);
  },

  // Filter on datastore userFilteredCollections based on linkage rules between tables
  // Event Place field links to Places Shortname field
  // Event Suspects, Victims and Witnesses fields link to People's Shortname field
  autoFilterCollections: function (selectAllCheckBoxes, sortCheckBoxes) {

    var eventsCollection = dataSourceStore.dataSource.getCollection(config.EventsCollection);

    // Manage the filter transform name in this store and listening collection
    // stores can use it when broadcasted
    filterTransforms.transformName = this.transformName;

    // Call filterStateChanged on each data store to ensure each store's userFilteredCollection is up to date
    eventsStore.filterStateChanged(filterTransforms);
    placesStore.filterStateChanged(filterTransforms);
    peopleStore.filterStateChanged(filterTransforms);
    sourcesStore.filterStateChanged(filterTransforms);

    // Set all event record's 'showRecord' properties that have been filtered out, to false
    eventsStore.setFilteredOutItemsToNotSelected(eventsCollection.data, eventsStore.userFilteredCollection.data());

    // Update all data types checkboxes to only show records from filtered records
    this.eventsCheckBoxUpdated(eventsCollection.data);

    // Update all Event Checkboxes
    if (selectAllCheckBoxes) {
      this.selectAllCheckboxes(eventsStore, true);
    }

    // Let listeners know data has been updated
    this.selectedDataChanged(sortCheckBoxes);
  },

  // Select all checkboxes in a store
  selectAllCheckboxes: function (store, value) {

    store.showAllSelected = value;

    // Set all records showRecord property to true
    store.userFilteredCollection.update(function (item) {
      item.showRecord = true;
    });

    this.eventsCheckBoxUpdated(eventsStore.userFilteredCollection.data());
  },

  // Fired from grid view when Select all checkbox is selected
  // If Select All is ticked on People or Places update the Related Sources
  showAllSelected: function(showAllObject) {

    // Set all model item's to show record
    showAllObject.collectionData.forEach(function(item) {
      if (showAllObject.showAllSelected) {
        item.showRecord = true;
      } else {
        item.showRecord = false;
      }
    });

    // Events
    if (showAllObject.collectionName === config.EventsCollection) {

      this.eventsCheckBoxUpdated(showAllObject.collectionData);

      // Places
    } else if (showAllObject.collectionName === config.PlacesCollection) {

      placesStore.userFilteredCollection.data().forEach(function (placeObject) {

        // Manage the Source Collection Selected Records
        this.autoUpdateSourceCheckboxes(placeObject, config.PlacesCollection);
      }.bind(this));

      // People
    } else if (showAllObject.collectionName === config.PeopleCollection) {

      peopleStore.userFilteredCollection.data().forEach(function (personObject) {

        // Manage the Source Collection Selected Records
        this.autoUpdateSourceCheckboxes(personObject, config.PeopleCollection);
      }.bind(this));
    }

    // Sort the order of selected records
    this.selectedDataChanged(true);
  },

  // Update showRecord property of collections
  checkBoxUpdated: function (showRecordObject) {

    switch (showRecordObject.collectionName) {
      case config.EventsCollection:

        // Start process of updating related data tables
        if (showRecordObject.userSelected) {
          this.eventsCheckBoxUpdated(showRecordObject.collectionData);
        }

        // If there has been a change to Select all, start the process of updating related data tables
        if (eventsStore.showAllSelected !== showRecordObject.showAllSelected) {
          this.eventsCheckBoxUpdated(showRecordObject.collectionData);
        }

        // Set property on the events store so the show All checkbox state will be maintained
        eventsStore.showAllSelected = showRecordObject.showAllSelected;

        // Let listeners know data has been updated
        this.selectedDataChanged(true);

        break;
      case config.PlacesCollection:

        if (showRecordObject.userSelected) {
          this.checkBoxUpdatedByUser(showRecordObject.item, showRecordObject.checkBoxSelected, config.PlacesCollection);
          this.selectedDataChanged(false);
        }

        // Set property on the events store so the show All checkbox state will be maintained
        placesStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      case config.PeopleCollection:

        if (showRecordObject.userSelected) {
          this.checkBoxUpdatedByUser(showRecordObject.item, showRecordObject.checkBoxSelected, config.PeopleCollection);
          this.selectedDataChanged(false);
        }

        // Set property on the events store so the show All checkbox state will be maintained
        peopleStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      case config.SourcesCollection:

        // Set property on the events store so the show All checkbox state will be maintained
        sourcesStore.showAllSelected = showRecordObject.showAllSelected;

        break;
      default:
    }
  },

  // Auto Update the Places, People and Sources selected records
  eventsCheckBoxUpdated: function (collectionData) {

    // Manage the Source Collection Selected Records that are related to Event Supporting Documents
    collectionData.forEach(function (eventObject) {
      this.autoUpdateSourceCheckboxes(eventObject, config.EventsCollection);
    }.bind(this));

    // Auto Update related Place checkboxes
    this.autoUpdatePlacesCheckboxes(collectionData);

    // Auto Update related People checkboxes
    this.autoUpdatePeopleCheckboxes(collectionData);
  },

  // When a checkbox has been manually updated
  checkBoxUpdatedByUser: function(item, checkBoxSelected, collectionName) {

    if (checkBoxSelected) {
      item.showRecord = true;
      item.userSelected = true;
    } else {
      item.showRecord = false;
      item.userSelected = false;
    }

    // Manage the Source Collection Selected Records
    this.autoUpdateSourceCheckboxes(item, collectionName);

    // Sort the order of Source records to selected
    this.sortBySelectedSourceRecords();
  },

  // Iterate through each record in Places collection and set showRecord to true and selectedByEvent to true
  autoUpdatePlacesCheckboxes: function (itemArray) {

    // Used to keep track of places in case the same place is used by an event record that isn't set to show and
    // then removes it from being set by a previous event which was set to show.
    var placeArray = [];

    itemArray.forEach(function (eventObject) {

      placesStore.userFilteredCollection.copy().find({
        'Short Name': {
          '$eq': eventObject.Place
        }
      }).update(function (placeObject) {

        // If the event record is selected
        if (eventObject.showRecord) {
          placeArray.push(placeObject);
          placeObject.showRecord = true;
          placeObject.selectedByEvent = true;
          placeObject.highlightAsRelatedToEvent = true;
        } else {
          if (placeArray.indexOf(placeObject) === -1) {

            // Only hide record if the user hadn't manually selected it
            if (!placeObject.userSelected) {
              placeObject.showRecord = false;
            }

            placeObject.selectedByEvent = false;
            placeObject.highlightAsRelatedToEvent = false;
          }
        }

        // Manage the Source Collection Selected Records
        this.autoUpdateSourceCheckboxes(placeObject, config.PlacesCollection);

      }.bind(this));
    }.bind(this));
  },

  // Find each record in People collection where People matches a person in Events collection and set showRecord,
  // selectedByEvent and highlightAsRelatedToEvent properties
  autoUpdatePeopleCheckboxes: function (itemArray) {

    // Helper methods for parsing People fields
    var filterSelected = function (item) {
      return item.showRecord === true;
    };

    var filterNonSelected = function (item) {
      return item.showRecord === false;
    };

    var split = function (item) {
      return _.union(item.Suspects.split(','), item.Victims.split(','), item.Witnesses.split(','));
    };

    var trim = function (item) {
      return item.trim();
    };

    // Parse People fields into single array of unique related people
    var relatedPeopleArray = _.uniq(_.map(_.flatten(_.map(_.filter(itemArray, filterSelected), split)), trim));

    // Parse People fields into single array of unique non related people
    var nonRelatedPeopleArray = _.difference(_.uniq(_.map(_.flatten(_.map(_.filter(itemArray, filterNonSelected), split)), trim)), relatedPeopleArray);

    // Update all People from the relatedPeople array to show
    relatedPeopleArray.forEach(function (person) {
      peopleStore.userFilteredCollection.copy().find({
        'Short Name': {
          '$eq': person
        }
      }).update(function (personObject) {

        personObject.showRecord = true;
        personObject.selectedByEvent = true;
        personObject.highlightAsRelatedToEvent = true;

        // Manage the Source Collection Selected Records
        this.autoUpdateSourceCheckboxes(personObject, config.PeopleCollection);

      }.bind(this));
    }.bind(this));

    // Update all People from the nonRelatedPeople array to not show
    nonRelatedPeopleArray.forEach(function (person) {
      peopleStore.userFilteredCollection.copy().find({
        'Short Name': {
          '$eq': person
        }
      }).update(function (personObject) {

        // Only hide record if the user hadn't manually selected it
        if (!personObject.userSelected) {
          personObject.showRecord = false;
        }

        personObject.selectedByEvent = false;
        personObject.highlightAsRelatedToEvent = false;

        // Manage the Source Collection Selected Records
        this.autoUpdateSourceCheckboxes(personObject, config.PeopleCollection);

      }.bind(this));
    }.bind(this));
  },

  // Add or remove Supporting Documents to each data type's array to work out whether to show a Source Record or not
  autoUpdateSourceCheckboxes: function (item, dataType) {

    var mergedObjectArray;
    var relatedSourceArray = [];

    // Helper methods for parsing Source records
    var trim = function (item) {
      if (item) {
        return item.trim();
      }
    };

    // Manage each data type's array
    switch (dataType) {
      case config.EventsCollection:
        if (item.showRecord === true && item['Supporting Documents']) {
          item.selectedByEvent = true;
          this.selectedEventDocuments.push(item);
        } else {
          item.selectedByEvent = false;
          _.remove(this.selectedEventDocuments, item);
        }
        break;
      case config.PlacesCollection:
        if (item.showRecord === true && item['Supporting Documents']) {
          item.selectedByPlace = true;
          this.selectedPlaceDocuments.push(item);
        } else {
          item.selectedByPlace = false;
          _.remove(this.selectedPlaceDocuments, item);
        }
        break;
      case config.PeopleCollection:
        if (item.showRecord === true && item['Supporting Documents']) {
          item.selectedByPeople = true;
          this.selectedPeopleDocuments.push(item);
        } else {
          item.selectedByPeople = false;
          _.remove(this.selectedPeopleDocuments, item);
        }
        break;
      default:
    }

    // Created array of related source shortnames to match
    mergedObjectArray = _.union(this.selectedEventDocuments, this.selectedPlaceDocuments, this.selectedPeopleDocuments);

    mergedObjectArray.forEach(function (item) {
      relatedSourceArray.push(_.map(item['Supporting Documents'].toString().split(','), trim));
    });

    relatedSourceArray = _.uniq(_.flatten(relatedSourceArray));

    // Update related source records to show
    sourcesStore.userFilteredCollection.copy().where(function (sourceObject) {
      return relatedSourceArray.indexOf(sourceObject['Short Name'].toString()) !== -1;
    }).update(function (sourceObject) {
      sourceObject.showRecord = true;
      sourceObject.selectedByEvent = true;
      sourceObject.highlightAsRelatedToEvent = true;
    });

    // Update non related source records to not show
    sourcesStore.userFilteredCollection.copy().data().forEach(function (item) {

      var itemArray = [];

      relatedSourceArray.forEach(function (sourceName) {
        if (item['Short Name'].toString() === sourceName) {
          itemArray.push(item);
        }
      });

      if (!itemArray.length) {
        item.showRecord = false;
        item.selectedByEvent = false;
        item.highlightAsRelatedToEvent = false;
      }
    });
  },

  // Let listeners know the userFilteredCollections have been updated
  selectedDataChanged: function(sortCheckBoxes) {

    // Only sort when checkboxes have been ticked, not when a sort has been done
    if (sortCheckBoxes) {
      this.sortBySelectedRecords();
    }

    // Pass data onto views
    eventsStore.trigger(eventsStore.userFilteredCollection.data());
    placesStore.trigger(placesStore.userFilteredCollection.data());
    peopleStore.trigger(peopleStore.userFilteredCollection.data());
    sourcesStore.trigger(sourcesStore);

    this.message = {
      type: 'userFilteredCollectionsUpdated'
    };

    this.trigger(this);
  },

  // Sort the collections by selected records
  sortBySelectedRecords: function() {
    placesStore.userFilteredCollection.simplesort('showRecord', true).data();
    peopleStore.userFilteredCollection.simplesort('showRecord', true).data();
    this.sortBySelectedSourceRecords();
  },

  // Sort the collections by selected source records
  // Needed because of scenario that all data tables can order sources
  sortBySelectedSourceRecords: function() {
    sourcesStore.userFilteredCollection.simplesort('showRecord', true).data();
  }
});
