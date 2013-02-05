/*
 * introspective
 * https://github.com/jrussell-ivantage/introspective
 *
 * Copyright (c) 2013 Justin
 * Licensed under the MIT license.
 */

'use strict';

var fs = require( "fs" )
	, path = require( "path" )
	, cp = require( "child_process" )
	, async = require( "async" )
	, npm = require( "npm" )
	, join = require( "path" ).join
	, repoTypeFromUrl
	, updateRepository
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
	opts.env.INTROSPECTIVE_PIDS = process.pid;

	// -----------------------------------------------------
	// These are optional but we have preferences for defaults
	// -----------------------------------------------------
	opts.stdio = opts.stdio || "inherit";

	// -----------------------------------------------------
	// Kick off the process that should restart us
	// -----------------------------------------------------
	console.log( path.normalize( __dirname + "/restart.js" ) );
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
			cb( appRoot ? null : new Error( "Introspective.update missing required config 'appRoot'." ) );
		},

		// -----------------------------------------------------
		// Get the project's package.json
		// -----------------------------------------------------
		function( cb ) {
			// Does it exist?
			fs.exists( join( appRoot, "package.json" ), function( exists ) {
				cb( exists ? null : new Error( "Introspective could not find a package.json in " + appRoot ) );
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
				, errMsg = "Introspective could not detect your repository url and type"
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
			npm.load( function( err, npm ) {
				npm.commands.install(
					// -----------------------------------------------------
					// Where to install
					// -----------------------------------------------------
					"**dir**",

					// -----------------------------------------------------
					// Package to install (the app itself)
					// -----------------------------------------------------
					"**dir**",

					// -----------------------------------------------------
					// callback
					// -----------------------------------------------------
					cb
				);
			});
		}

	], cb);

};

// -----------------------------------------------------
// Do we have other older processes that we should kill?
// -----------------------------------------------------
exports.only = function() {
	var pid = process.env.INTROSPECTIVE_PIDS;

	if( pid ) {
		String( pid ).split( "," ).forEach( function( p ) {
			try {
				process.kill( p );
			} catch ( e ) {
				console.warn( "Introspective was unable to kill process: " + p );
				console.warn( e );
			}
		});
	}

};

// -----------------------------------------------------
// Try to guess at what type of repo (git,svn,etc) this is based on the url.
// -----------------------------------------------------
repoTypeFromUrl = function( url ) {
	// [implement]
	return "git";
};

updateRepository = function( appRoot, repoType, repoUrl, cb ) {
	// [implement]
	cb();
};
