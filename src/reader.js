'use strict';

/*
 * An audit trail that is a file.
 */
 
var fs = require('fs');
var stream = require('stream');
var split = require('split');
var sally = require('./sally');

module.exports = function (path, secret) {
	var lineNumber = 0;
	var previousDigest;
	var audit = new stream.Transform({ 
		objectMode: true,
		transform: function(line, encoding, done) {
			var transform = this;
			++lineNumber;
			if (!line || line === '') 
				return done();
			try {
				var entry = JSON.parse(line);
				if (!entry.digest)
					throw new Error("The digest is missing.");
				var msg = entry.audit || entry.epoch || entry.cycle;
				if (!msg)
					throw new Error("The audit information is missing.");
				if (!sally.verify(msg, entry.digest, previousDigest, secret))
					throw new Error("Evidence of tampering, cannot verify the audit log entry.");
				previousDigest = entry.digest;
				if (entry.cycle && entry.cycle.endTime)
					previousDigest = undefined;
				transform.push(entry);
			}
			catch (e) {
				transform.emit('error', new Error(path + ':' + lineNumber + ' ' + e.message));
			}
			done();
		}
	});
	return fs.createReadStream(path, { encoding: 'utf8' })
		.pipe(split())
		.pipe(audit);
};

