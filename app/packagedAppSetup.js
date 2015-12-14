
var appConfig = {

  getSourcePath: function() {
    return '';
  }
};

if (typeof global === 'object') {

  // Use for non browserify requires
  var electronRequire = require;

  var electronApp = require('electron');
  var fs = require('fs');

  // ToDo: Change to something that isn't users desktop
  var configDirectory = electronApp.remote.app.getPath('desktop');
  var remoteConfig;

  appConfig = {

    getSourcePath: function() {
      return this.paths.sourcePath;
    }
  };

  fs.readFile(configDirectory + '/SITF/ConfigWindows/appConfig.json', 'utf-8', function(err, data) {

    if (data) {
      remoteConfig = JSON.parse(data);
      appConfig.paths = remoteConfig.paths;
      window.app.dataSourceActions.checkForLDAP();
    } else if (err) {
      console.error(err);
    }
  });

  // Set property if inside packaged app
  global.packagedApp = true;
}
