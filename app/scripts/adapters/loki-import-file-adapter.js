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
 * loadDatabase() - Retrieves a serialized db string from the catalog.
 *
 *  @example
 // LOAD
 var fileAdapter = require('./lokiFileAdapter');
 var db = new loki('test', { adapter: fileAdapter });
 db.loadDatabase(function(result) {
		console.log('done');
	});
 *
 * @param {string} dbname - the name of the database to retrieve.
 * @param {function} callback - callback should accept string param containing serialized db string.
 */
lokiFileAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {

  // ToDo: Make configurable by user or admin
  var path = global.config ? config.paths.dbPath : '';

  fs.readFile(path + '/' + dbname, 'utf-8', function(err, data) {

    var dataStore = err || data;
    callback(dataStore);
  });
};

module.exports = new lokiFileAdapter();
exports.lokiFileAdapter = lokiFileAdapter;
