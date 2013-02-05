var cp = require( "child_process" )
	, fs = require( "fs" )
	, async = require( "async" )
	;

// -----------------------------------------------------
// This should be run from that app root, note that environment vars should be
// passed along by default
// -----------------------------------------------------

// -----------------------------------------------------
// [implement] can't run npm scripts with cp.spawn on windows!
// -----------------------------------------------------

cp.spawn( "node", ["index"], {
	stdio: "inherit",
	cwd: process.cwd()
}).unref();
