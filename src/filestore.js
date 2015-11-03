'use strict';

/*
 * An audit trail that is a file.
 */
 
var fs = require('fs');
var sally = require('./sally');
var self = {};

function encode(entry) {
	return JSON.stringify(entry) + '\n';
}

self.init = function () {
	sally.on('log', function (audit, digest) {
		var entry = {
			audit: audit,
			digest: digest
		};
		fs.appendFileSync(self.path, encode(entry));
	});
	
	return self;
};

module.exports = function(opts)
{
	opts = opts || {};
	self.path = opts.path || 'sally.log';
	
	return self.init();
}
