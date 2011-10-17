var fs = require('fs');
exports.load =  function(opt) {
	this.opt = this.opt || opt || {};
	var oldopt = this.opt;
	var olddata = this.data;
	this.opt.path = opt.confpath || this.opt.path || 'local/etc/';
	this.opt.name = opt.confname || this.opt.name || 'default'; 
	this.opt.ext = opt.confext || this.opt.ext || '.conf.js'; 
	this.opt.file = this.opt.path + this.opt.name + this.opt.ext;
	this.opt.configure = opt.configure || this.opt.configure || function() {};
	
	try {
		this.data = eval('('+fs.readFileSync(this.opt.file)+')');
		this.opt.configure(this.opt,this.data);
		return this.data;
	} catch (e) {
		try {
			this.data = olddata;
			this.opt = oldopt;
			this.opt.configure(this.opt,this.data);
			return false;
		} catch (f) {
			throw({message:"PANIC Old configuration NOT restored.\n"+e.message+"\n"+f.message});
		}
	};
	return false;
}

