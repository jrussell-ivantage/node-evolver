/*
 * evolver
 * https://github.com/jrussell-ivantage/evolver
 *
 * Copyright (c) 2013 Justin
 * Licensed under the MIT license.
 */

'use strict';

var fs = require( "fs" )
	, path = require( "path" )
	, cp = require( "child_process" )
	, async = require( "async" )
	, join = require( "path" ).join
	, repoTypeFromUrl
	, updateRepository, updateGit, updateSvn
	;

exports.restart = function( args, opts, cb ) {
	// [todo]
	// cp.spawn restart.js
	var pid = process.pid
		, child
		;

	// -----------------------------------------------------
	// Assume we're in the "node_modules" folder of the app
	// -----------------------------------------------------
	args = args || {
		appRoot: path.normalize( __dirname + "/../../.." )
	};

	// -----------------------------------------------------
	// These are the only opts we need to set
	// -----------------------------------------------------
	opts = opts || {};
	opts.detached = false;
	opts.cwd = args.appRoot;
	opts.env = opts.env || process.env;
	opts.env.EVOLVER_PIDS = process.pid;

	// -----------------------------------------------------
	// These are optional but we have preferences for defaults
	// -----------------------------------------------------
	opts.stdio = opts.stdio || "inherit";

	// -----------------------------------------------------
	// Kick off the process that should restart us
	// -----------------------------------------------------
	child = cp.spawn(
		"node",
		[path.normalize( __dirname + "/restart.js" )],
		opts
	).unref();

	// -----------------------------------------------------
	// By default we'll exit this process and hope for best... but for those that
	// are a bit more cautious we can defer the exit until later (i.e. use the
	// pid to later kill this process)
	// -----------------------------------------------------
	//if( !args.deferExit ) {
	//	process.nextTick( process.exit );
	//}
};

exports.update = function( appRoot, cb ) {
	async.waterfall([
		// -----------------------------------------------------
		// Call off the show if we don't have an app root
		// -----------------------------------------------------
		function( cb ) {
			cb( appRoot ? null : new Error( "Evolver.update missing required config 'appRoot'." ) );
		},

		// -----------------------------------------------------
		// Get the project's package.json
		// -----------------------------------------------------
		function( cb ) {
			// Does it exist?
			fs.exists( join( appRoot, "package.json" ), function( exists ) {
				cb( exists ? null : new Error( "Evolver could not find a package.json in " + appRoot ) );
			});
		},

		function( cb ) {
			// If we got this far we know the package.json exists
			fs.readFile( join( appRoot, "package.json" ), "utf8", cb );
		},

		function( data, cb ) {
			// w00t we got the package.json data
			var err
				, pkg
				;

			try {
				// We should be able to jsonify the package.json contents... but just to
				// be safe...
				pkg = JSON.parse( data );
			} catch( e ) {
				err = e;
			}

			cb ( err, pkg );
		},

		// -----------------------------------------------------
		// Gather the repository type and url
		// -----------------------------------------------------
		function( pkg, cb ) {
			// -----------------------------------------------------
			// From the package.json detect the repository type we're working with or
			// assume it from the repository url. Perform the relevent update
			// operations
			// -----------------------------------------------------
			var repo = pkg.repository
				, repoUrl = repo ? repo.url : null
				, repoType = repo ? repo.type : null
				, errMsg = "Evolver could not detect your repository url and type"
				;

			// If we have a url but weren't give na type try to infer the type
			if( repoUrl && !repoType ) {
				repoType = repoTypeFromUrl( repoUrl );
			}

			cb(
				repoUrl && repoType ?  null : new Error( errMsg ),
				repoType,
				repoUrl
			);
		},

		// -----------------------------------------------------
		// Update the app as necessary given the repo type
		// -----------------------------------------------------
		function( repoType, repoUrl, cb ) {
			updateRepository( appRoot, repoType, repoUrl, cb );
		},

		// -----------------------------------------------------
		// So far so good - we've updated the application code now we need to make
		// sure our dependencies are up to date.
		// -----------------------------------------------------
		function( cb ) {
			var env = {}
				, key;

			// -----------------------------------------------------
			// So... I don't think npm likes running an update after it's already been
			// loaded and (i.e. if your app was started via `npm start`) so for our
			// new process lets strip away all of npm's environment variables to give
			// us a clean slate.
			// -----------------------------------------------------
			for( key in process.env ) {
				if( key.toLowerCase().indexOf( "npm" ) === -1 ) {
					env[key] = process.env[key];
				}
			}

			cp.exec( "npm install", {
				stdio: "inherit",
				cwd: appRoot,
				env: env
			}).on( "exit", function( code ) {
				cb( code > 0 ? new Error( "npm install failed with code: " + code ) : null );
			});
		}

	], cb);

};

// -----------------------------------------------------
// Do we have other older processes that we should kill?
// -----------------------------------------------------
exports.only = function() {
	var pid = process.env.EVOLVER_PIDS;

	if( pid ) {
		String( pid ).split( "," ).forEach( function( p ) {
			try {
				process.kill( p );
			} catch ( e ) {
				console.warn( "Evolver was unable to kill process: " + p );
				console.warn( e );
			}
		});
	}

};

// -----------------------------------------------------
// Try to guess at what type of repo (git,svn,etc) this is based on the url.
// -----------------------------------------------------
repoTypeFromUrl = function( url ) {
	var prefix = url.replace( /:.*/, "" )
		, suffix = url.replace( /.*\./, "" )
		, guesses = ["svn","git"]
		;

	if( guesses.indexOf( prefix ) > -1 ) {
		return prefix;
	}

	if( guesses.indexOf( suffix ) > -1 ) {
		return suffix;
	}

	// Probably get a lot of mileage out of this...
	if( url.indexOf( "github" ) > -1 ) {
		return "git";
	}

	// Whelp
	return null;
};

// -----------------------------------------------------
// Branch out depending on which type of version control the app uses
// -----------------------------------------------------
updateRepository = function( appRoot, repoType, repoUrl, cb ) {
	if( "svn" === repoType ) {
		updateSvn( appRoot, repoUrl, cb );
	} else if( "git" === repoType ) {
		updateGit( appRoot, repoUrl, cb );
	} else {
		cb( new Error( "Instrospective doesn't recognize the version control system: " + repoType ) );
	}
};

updateSvn = function( appRoot, repoUrl, cb ) {
	cp.spawn( "svn", ["update"], {
		stdio: "inherit",
		cwd: appRoot
	}).on( "exit", function( code ) {
		cb( 0 !== code ? new Error( "Subversion update failed" ) : null );
	});
};

updateGit = function( appRoot, repoUrl, cb ) {
	cp.spawn( "git", ["pull"], {
		stdio: "inherit",
		cwd: appRoot
	}).on( "exit", function( code ) {
		cb( 0 !== code ? new Error( "Git pull failed" ) : null );
	});
};
