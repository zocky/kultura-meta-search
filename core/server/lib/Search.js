function Search( socket , sources ) {
	this.socket = socket;
	this.store = {};
	this.busy = 0;
	var me = this;
	
	for (var i in sources) {
		this.addSource( i , sources[i]);
	}
	this.socket.on('search', function(msg) {
		me.search(msg);
	});
	this.socket.on('search-more', function(msg) {
		me.searchMore(msg);
	});
	this.socket.on('disconnect', function() {
		delete me.socket;
	});
	this.socket.emit('welcome', {protocol:'kultura',version:'0.1prealpha'});
}
Search.prototype = {
	addSource: function (id, src) {
		this.store[id] = {
			source: src,
			meta: {}
		};
		this.socket.emit('source-added', src.info);
	},
	search: function(msg) {
		if (this.q) {
			this.error('search already started');
			return;
		};
		if (!msg.q) {
			this.error('empty search string');
			return;
		};
		this.q = msg.q;
		var count = 0;
		var me = this;
		for (var i in this.store) {
			count++;
			me.searchSource(i, {q: this.q});
		};
		this.socket.emit('search_started', { sourceCount: count});
	},
	searchMore: function(msg) {
		var id = msg.id;
		if (!this.store[id]) {
			this.sourceError(id,'bad source id');
			return;
		};
		var more = this.store[id].meta.more;
		if (!more) {
			this.sourceError(id,'no more results');
			return;
		};
		this.searchSource(id, {q: this.q, more: this.store[id].meta.more});
		this.socket.emit('search_started', { sourceCount: 1});
	},
	searchSource: function(id,args) {
		if (!this.store[id]) {
			this.sourceError(id,'bad source id');
		}
		var me = this;
		this.store[id].source.search(args, function (data) {
			me.onResults(id, data);
		}, function(e) {
			me.sourceError(id,'source unreachable');
		});
		this.busy++;
	},
	onResults: function(id,data) {
		var store = this.store[id];
		var src = this.store[id].source;
		store.meta = data.meta;
		for (var i in data.info) {
			store.info[i] = data.info[i];
		}
		var send = {
			search: data.search,
			source: src.info,
			results: [],
			info: store.info || {}
		}
		for (var i in data.results) {
			var res = data.results[i];
			res.type = res.type || 'Thing';
			if (res.title && res.url) send.results.push(res);
		}
		this.socket.emit('search_results',send);
		this.busy--;
		if (this.busy==0) {
			this.socket.emit('search_complete',{});
		}
	},
	error: function(m) {
		this.socket.emit('search_error',{message:m});
	},
	sourceError: function(id,m) {
		this.busy--;
		this.socket.emit('source_error',{source:id,message:m});
	}
}
module.exports = Search;
