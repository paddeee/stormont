if (typeof global === 'object') {

  // Use for non browserify requires
  var electronRequire = require;

  var electronApp = require('electron');
  var fs = require('fs');

  // ToDo: Change to something that isn't users desktop
  var configDirectory = electronApp.remote.app.getPath('desktop');
  var remoteConfig;

  var appConfig = {

    getSourcePath: function() {

      if (global.packagedApp) {
        return this.paths.sourcePath;
      } else {
        return '';
      }
    }
  };

  fs.readFile(configDirectory + '/appConfig.json', 'utf-8', function(err, data) {

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
