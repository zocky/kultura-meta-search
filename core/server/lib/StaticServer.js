var url = require('url');
var fs = require('fs');

var server;

var files = {
	"/":  "core/client/index.html",
	"/robots.txt": "core/server/robots.txt",
};
var paths = {
	"/css/":  "core/client/css/",
	"/js/": "core/client/js/",
	"/static/": "local/static/"
};
var types = {
	html:	'text/html',
	css:	'text/css',
	js:		'application/javascript',
	png:	'application/png',
	gif:	'application/gif',
	jpeg:	'application/jpeg',
	woff:	'font/opentype',
	ttf:	'font/ttf'
};

function handleRequest (req,res) {
	var u = url.parse(req.url,true);
	var p = u.pathname;
	if (files[p]) {
		sendFile (res,files[p]);
		return;
	}
	var m = p.match(/^(\/\w+\/)(.*)$/);
	
	if (m && paths[m[1]]) {
		sendFile (res,paths[m[1]]+m[2]);
		return;
	} 
	res.writeHead(404);
	res.end('No such such.');
}

// send file from fs to http client
function sendFile(res,filename) {
	var type = types[filename.match(/\w+$/)[0]] || 'text/plain';
	console.log('sending file '+filename+' - '+type);
	var stream = fs.createReadStream(filename);
	stream.on('error', function() {
		res.writeHead(404);
		return res.end('No such file ' + filename);
	})
	res.writeHead(200, {
		'Content-Type': type
	});
	stream.pipe(res);
}
var http=require('http');
exports.start = function ( opt ) {
	for(var i in opt.files) this.files[i] = opt.files[i];
	for(var i in opt.files) this.files[i] = opt.files[i];
	exports.server = http.createServer(handleRequest);
	return this;
}
