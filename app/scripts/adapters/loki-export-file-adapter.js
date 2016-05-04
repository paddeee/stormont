/**
 * @file lokiFileAdapter.js
 */

/*
 * Uses browserify-fs rather than fs so can run in browser for easier testing in development
 */


/**
 * require libs
 * @ignore
 */
var fs = global.config ? electronRequire('fs') : require('browserify-fs');
var config = global.config ? global.config : require('../config/config.js');

/**
 * The constructor is automatically called on `require` , see examples below
 * @constructor
 */
function lokiFileAdapter() {}

/**
 *
 @example
 // SAVE : will save database in 'test'
 var fileAdapter = require('./lokiFileAdapter');
 var loki=require('lokijs');
 var db = new loki('test',{ adapter: fileAdapter });
 var coll = db.addCollection('testColl');
 coll.insert({test: 'val'});
 db.saveDatabase();  // could pass callback if needed for async complete

 * saveDatabase() - Saves a serialized db to the catalog.
 *
 * @param {string} dbname - the name to give the serialized database within the catalog.
 * @param {string} dbstring - the serialized db string to save.
 * @param {function} callback - (Optional) callback passed obj.success with true or false
 */
lokiFileAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {

  var path = global.config ? this.tempExportDirectory : '';

  fs.mkdir(path, function() {
    fs.writeFile(path + '/' + dbname, dbstring, function() {
      fs.readFile(path + '/' + dbname, 'utf-8', function(err, data) {
        var dataStore = err || data;
        callback(dataStore);
      });
    });
  });
};

module.exports = new lokiFileAdapter();
exports.lokiFileAdapter = lokiFileAdapter;
