'use strict';

/*
 * An audit trail that is a file.
 */
 
var fs = require('fs');
var stream = require('stream')
var split = require('split');

/**
 * AuditFile constructor.
 */
function SallyReader(opts)
{
	this.sally = require('./sally');
	
	opts = opts || {};
	this.path = opts.path || 'sally.log';
	this.secret = opts.secret;
}


function decode(s) {
	var o = JSON.parse(s);
	if (!o.digest)
		throw new Error("The digest is missing.");
	if (!(o.audit || o.cycle || o.epoch))
		throw new Error("The audit information is missing.");
	return o;
}

SallyReader.prototype.createReadStream = function () {
	var lineNumber = 0;
	var previousDigest;
	var self = this;
	var audit = new stream.Transform({ 
		objectMode: true,
		transform: function(line, encoding, done) {
			var transform = this;
			++lineNumber;
			if (!line || line == '') return done();
			try {
				var entry = decode(line);
				if (!self.sally.verify(entry.audit || entry.epoch || entry.cycle, entry.digest, previousDigest, self.secret))
					throw new Error("Evidence of tampering, cannot verify the audit log entry.");
				previousDigest = entry.digest;
				if (entry.cycle && entry.cycle.endTime)
					previousDigest = undefined;
				transform.push(entry);
			}
			catch (e) {
				transform.emit('error', new Error(self.path + ':' + lineNumber + ' ' + e.message));
			}
			done();
		}
	});
	return fs.createReadStream(this.path, { encoding: 'utf8' })
		.pipe(split())
		.pipe(audit);
};

module.exports = SallyReader;
