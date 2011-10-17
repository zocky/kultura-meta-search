var SearchState = require('./Search.js');
var SearchSource = require('./Source.js');
var sources = {};
exports.start = function( staticServer , opt) {
	for (var i in opt.sources) {
		sources[i] = new SearchSource( i , opt.sources[i] , opt.source_template);
		console.log(sources[i].conf)
	}
	exports.server = require('socket.io')
	.listen(staticServer);
	exports.server.sockets.on('connection', function(socket) {
		new SearchState( socket , sources );
	});
	exports.server.configure(function() {
		console.log('configuring io');
		for (var i in opt.io) exports.server.set(i,opt.io[i]);
	});
	return this;
}
