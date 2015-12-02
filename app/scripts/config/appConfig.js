'use strict';

var appConfig = {

  dbPath: '/Users/ODonnell/SITF/SITFLoki',

  sourcePath: '/Users/ODonnell/SITF/SITFSource',

  exportPath: '/Users/ODonnell/SITF/SITFExports',

  getSourcePath: function() {

    if (global.packagedApp) {
      return this.sourcePath;
    } else {
      return '';
    }
  }
};

module.exports = appConfig;
