// KULTURA Meta search
// (c) 2011 user:zocky @ wiki.ljudmila.org
// GPL 3.0 applies
//
// the transceiver

var http = require('http');
var fs = require('fs');
var url = require('url');
var config = require('./config.js');


// helpers

// classic get url function
function wget (options, onSuccess, onFail) {
	console.log(options.host,options.port,options.path);
	http.get(options, function(res) {
		res.setEncoding('utf8');
		var data = '';
		res.on('data',function(chunk) { data+=chunk; });
		res.on('end',function() {
			onSuccess(data);
		});
	}).on('error', function() {
		console.log(options);
		onFail();
	});
}
// send file from fs to http client
function sendFile(res,filename) {
	console.log('sending file '+filename);
	fs.readFile(filename, function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading ' + filename);
		}
		res.writeHead(200);
		res.end(data);
	});
}
// load initial configuration, or die
function loadConfig(opt) {
	opt.configure = configure;
	try {
		config.load(opt);
		console.log('successfully configured from '+config.opt.file);
	} catch (e) {
		console.log('configuration from '+config.opt.file+' rejected: '+e.message + " ("+e.file+")");
		process.exit(1);		
	};
}

// interactively load new configuration, or fall back to previous
function reconfigureFromWeb(res,name) {
	try {
		var msg = 'successfully configured from '+config.opt.file;
		config.load(opt);
		console.log(msg); 
		res.writeHead(200);
		configure();
		return res.end(msg);
	} catch (e) {
		var msg = 'configuration from '+config.opt.file+' rejected: '+e.message;
		console.log(msg); 
		res.writeHead(500);
		res.end(msg);
	};
}

// really set settings from configuration
function configure (opt,data) {
	// configure io.socket
	_this.socketServer.configure(function() {
		console.log('configuring io');
		for (var i in data.io) _this.socketServer.set(i,data.io[i]);
	});
	_this.sources={};
	
	// configure sources, fill in missing properties from the defaultSource
	for (var i in data.sources) {
		var srcData = data.sources[i];
		var srcDef = data.defaultSource || {};
		var srcNew = {};
		srcNew.id = i;
		srcNew.name = srcData.name || i;
		for (var j in srcDef) srcNew[j] = typeof(srcDef[j])=='string' ? srcDef[j].replace('{{{id}}}',i) : srcDef[j];
		for (var j in srcData) srcNew[j] = srcData[j];
		srcNew.show = {
			id: srcNew.id,
			name: srcNew.name,
			home: srcNew.home
		}
		_this.sources[i]=srcNew;
		console.log('added source '+i);
	}
	// copy paths of static files
	_this.paths = data.paths;
}

// handle http requests 
function onHttpRequest (req,res) {
	var u = url.parse(req.url,true);
	if (u.pathname == '/' && u.query.conf) {
		// ?conf=filename -> read configuration from etc/filename.conf.js
		reconfigureFromWeb(res,u.query.conf);
	} else if (u.pathname =='/') {
		// send index.html
		sendFile(res, 'static/index.html');
	} else if (_this.paths[u.pathname] && _this.paths[u.pathname].file) {
		// send other path
		sendFile(res,_this.paths[u.pathname].file);
	} else {
		res.writeHead(404);
		res.end('No such such.');
	}
}

// handle socket connection
function onSocketConnected (socket) {
	//handle search requests
	socket.on('search', function (msg) {
		var count = 0;
		//loop through all sources
	  	for (var i in _this.sources) {
	  		// count sources
	  		count++;
	  		// get results
	  		(function(id, src) {
	  			wget ({
		  			host: src.host,
		  			port: src.port||80,
		  			path: src.path+'?q='+encodeURIComponent(msg.q)
		  		}, function(data) {
	  				// success: parse data and send it to client
		  			try {
		  				console.log(data);
						data = JSON.parse(data);
						socket.emit('results',{
							source: src,
							results: data.results
						});
					} catch (e) {}
					// if done with all sources, inform client
					if (--count==0) socket.emit('endresults');
		  		} , function() {
		  			// failed: clean up
		  			console.log('failed lookup: '+id);
					// if done with all sources, inform client
					if (--count==0) socket.emit('endresults');
		  		});
		  	})(i, _this.sources[i]);
		};
	});
	// tell the client we're ready
	socket.emit('welcome', {protocol:'kultura',version:'0.1prealpha'});
};

var _this = exports;

// start servers
exports.init = function (opt) {
	_this.port = opt.port || 9701;
	_this.httpServer = http.createServer(onHttpRequest);
	_this.socketServer = require('socket.io').listen(this.httpServer); 
	_this.socketServer.sockets.on('connection', onSocketConnected);
	_this.httpServer.listen(this.port);
	loadConfig(opt);	
	return _this;
}


