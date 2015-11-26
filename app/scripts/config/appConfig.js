'use strict';

var appConfig = {

  sourcePath: '/Users/ODonnell/Documents/FarrellLoki/source',

  getSourcePath: function() {

    if (global.packagedApp) {
      return this.sourcePath;
    } else {
      return '';
    }
  }
};

module.exports = appConfig;
