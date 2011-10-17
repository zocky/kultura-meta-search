// KULTURA Meta search
// (c) 2011 user:zocky @ wiki.ljudmila.org
// GPL 3.0 applies
//
// meta search collater
// index.js  

// local module variables

var config = require('./lib/config.js');
var myConfig;
var staticServer;
var searchServer;

// module interface
exports.start = function( opt ) {
	myConfig = config.load( opt );
	staticServer = require('./lib/StaticServer.js').start( myConfig.http );
	searchServer = require('./lib/SearchServer.js').start( staticServer.server , myConfig.search );
	staticServer.server.listen(opt.port||9701);
}
