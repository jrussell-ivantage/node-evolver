# evolver

Update and restart your app... from your app.

## Getting Started
Install the module with: `npm install evolver`

## Documentation

#### Restart
Evolver can restart your application with `evolver.restart()`. By default it'll
look for a `start` script in your `package.json`, if it doesn't find one it just
tries to hit your project's root with `node`. 

NOTE: Evolver will not kill running instances of your app. Use `evolver.only()`
to get rid of previous instance (only kills processes that triggered a restart).

#### Update
Evolver can update your app's code base programmatically! Evolver is not
intended to be a replacement for any part of your CI solution but can be an aid
in situations when your options are limited.

To update your app's code base use `evolver.update`. To avoid any... horrible
issues you must tell the update method where your project root lives:

```javascript
var evolver = require( "evolver" );
evolver.update( __dirname, function( err ) {
  if( err ) throw err;
  console.log( "Update has finished!" );
});
```

Evolver checks your app's `package.json` for a repo type (currently supports git
and svn), and a repo url. Once the latest and greatest changes have been fetched
from your app's repo evolver will issue an `npm install` to make sure you have
all the node modules you're dependent on. Finally the callback is run, if an
error was encountered it will be passed here otherwise there are no parameters
given to the callback function.

NOTE: The appropriate version control executables must be included in your path.
If you're trying to update a git repo and typing `git` at the command line does
nothing... whelp.

#### Example
Express applications can drop in a bootstrap file to make use of evolver:

```javascript
var evolver = require( "evolver" );

// -----------------------------------------------------
// Make sure we're update to date
// -----------------------------------------------------
evolver.update( __dirname, function( err ) {
  // -----------------------------------------------------
  // Errors usually occur when
  // * The repo type cannot be determined
  // * The git, svn, etc. commands aren't visible to evolver
  // -----------------------------------------------------
  if( err ) throw err; 

  // -----------------------------------------------------
  // Make sure no other instances are running
  // -----------------------------------------------------
  evolver.only();

  // -----------------------------------------------------
  // Start the application
  // -----------------------------------------------------
  require( "./app" );
});
```

## TODO
* Formal tests
* Work around the npm error displayed when instances are taken down with `only`

## Contributing
In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Justin  
Licensed under the MIT license.
