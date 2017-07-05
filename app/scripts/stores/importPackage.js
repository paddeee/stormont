'use strict';

var Reflux = require('reflux');
var loki = require('lokijs');
var ImportPackageActions = require('../actions/importPackage.js');
var dataSourceStore = require('../stores/dataSource.js');
var config = require('../config/config.js');
var path = appMode === 'app' ? window.electronRequire('path') : null;
var klaw = appMode === 'app' ? window.electronRequire('klaw') : null;
var through2 = appMode === 'app' ? window.electronRequire('through2') : null;

module.exports = Reflux.createStore({

  // this will set up listeners to all publishers in ExportActions, using onKeyname (or keyname) as callbacks
  listenables: [ImportPackageActions],

  // When a directory of files is selected
  onPackageSelected: function(packageObject) {

    global.config = config;

    this.sourceFilesDirectory = packageObject.packageLocation + '/';

    this.createFileDatabase();
  },

  hasExtension: function(typeToTest, validTypes) {
    return (new RegExp('(' + validTypes.join('|').replace(/\./g, '\\.') + ')$')).test(typeToTest);
  },

  // Create empty loki db
  createFileDatabase: function() {

    dataSourceStore.dataSource = new loki('EPE.json');

    var validFileTypes = ['.pdf', '.jpg', '.jpeg', '.gif', '.png', 'm4a', 'mp3', 'wav', 'avi', 'mp4', 'mov', 'webm'];
    var sourceCollection = dataSourceStore.dataSource.addCollection(config.SourcesCollection.name);

    this.getSourceCollectionData(this.sourceFilesDirectory)
      .then(function(filePaths) {

        var validFiles = filePaths.filter(function(filePath) {

          var fileExtension = path.extname(filePath);

          // Check file is valid
          return this.hasExtension(fileExtension, validFileTypes);

        }.bind(this));

        var fileObjects = validFiles.map(function(filePath) {

          var file = {};
          var fileName = path.basename(filePath);
          var fileExtension = path.extname(filePath);
          file['Full Name'] = fileName;
          file['Short Name'] = fileName;
          file['Linked File'] = fileName;
          file.Extension = fileExtension;
          file.FileType = this.getFileType(fileExtension);
          file.Path = filePath;

          return file;

        }.bind(this));

        sourceCollection.insert(fileObjects);

        this.message = 'createFilterTransforms';
        this.trigger(this);
        this.message = 'importSuccess';
        this.trigger(this);
      }.bind(this));
  },

  // Return a file type based on a file extension
  getFileType: function(fileExtension) {

    var fileType;

    switch (fileExtension) {
      case 'pdf':
        fileType = 'Document';
        break;
      case 'jpg':
        fileType = 'Image';
        break;
      case 'jpeg':
        fileType = 'Image';
        break;
      case 'gif':
        fileType = 'Image';
        break;
      case 'png':
        fileType = 'Image';
        break;
      case 'm4a':
        fileType = 'Audio';
        break;
      case 'mp3':
        fileType = 'Audio';
        break;
      case 'wav':
        fileType = 'Audio';
        break;
      case 'avi':
        fileType = 'Video';
        break;
      case 'mp4':
        fileType = 'Video';
        break;
      case 'mov':
        fileType = 'Video';
        break;
      case 'webm':
        fileType = 'Video';
        break;
      case 'tif':
        fileType = 'Document';
        break;
      case 'tiff':
        fileType = 'Document';
        break;
      default:
        fileType = 'Unknown';
    }

    return fileType;
  },

  // Return array of Source File info
  getSourceCollectionData: function(sourceFilesDirectory) {

    return new Promise(function(resolve) {

      var excludeDirFilter = through2.obj(function (item, enc, next) {
        if (!item.stats.isDirectory()) {
          this.push(item);
        }
        next();
      });

      var items = [];

      klaw(sourceFilesDirectory)
        .pipe(excludeDirFilter)
        .on('data', function (item) {
          items.push(item.path);
        })
        .on('end', function () {
          resolve(items); // => [ ... array of files without directories]
        });
    });
  }
});
