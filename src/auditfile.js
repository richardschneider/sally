'use strict';

/*
 * An audit trail that is a file.
 */
 
var fs = require('fs');
var stream = require('stream')
var split = require('split');
var sally = require('./sally');
var self = {};

/*
 * An entry is one line in the files.
 */
function encode(entry) {
	return JSON.stringify(entry) + '\n';
}

function decode(s) {
	var o = JSON.parse(s);
	if (!o.digest)
		throw new Error("The digest is missing.");
	if (!o.audit)
		throw new Error("The audit information is missing.");
	return o;
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

self.createReadStream = function () {
	var lineNumber = 0;
	var previousDigest;
	var audit = new stream.Transform({ 
		objectMode: true,
		transform: function(line, encoding, done) {
			var transform = this;
			++lineNumber;
			if (!line || line == '') return done();
			try {
				var entry = decode(line);
				if (!sally.verify(entry.audit, entry.digest, previousDigest))
					throw new Error("Evidence of tampering, cannot verify the audit log entry.");
				previousDigest = entry.digest;
				transform.push(entry);
			}
			catch (e) {
				transform.emit('error', new Error(self.path + ':' + lineNumber + ' ' + e.message));
			}
			done();
		}
	});
	return fs.createReadStream(self.path, { encoding: 'utf8' })
		.pipe(split())
		.pipe(audit);
};

module.exports = function(opts)
{
	opts = opts || {};
	self.path = opts.path || 'sally.log';
	
	return self.init();
}
