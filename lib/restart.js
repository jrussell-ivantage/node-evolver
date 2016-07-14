var cp = require('child_process')
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , appRoot = path.normalize(process.cwd());

// -----------------------------------------------------
// This should be run from that app root, note that environment vars should be
// passed along by default
// -----------------------------------------------------

async.waterfall([
  // -----------------------------------------------------
  // Try to get the package.json
  // -----------------------------------------------------
  function(cb) {
    fs.readFile(appRoot + '/package.json', 'utf8', cb);
  },

  function(data, cb) {
    var pkg
      , err;

    try {
      pkg = JSON.parse(data);
    } catch(e) {
      err = e;
    }

    cb(err, pkg);
  },

  // -----------------------------------------------------
  // See if there is a 'start' script in the package.json
  // -----------------------------------------------------
  function(pkg, cb) {
    if(pkg.scripts && pkg.scripts.start) {
      // We have a start script - w00t!
      cb(null, pkg.scripts.start.trim().split(' '));
    } else {
      // If we don't have a start script... just hit the app with node?
      console.warn('Evolver would really rather you have an explicit start script in your package.json');
      cb(null, ['node', appRoot]);
    }
  }

// -----------------------------------------------------
// The final callback - launch the app
// -----------------------------------------------------
], function(err, args) {
  cp.spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    cwd: appRoot
  }).unref();
});
