'use strict';

/*
 * An audit trail that is a file.
 */
 
var fs = require('fs');
var stream = require('stream')
var sally = require('./sally');
var self = {};

/*
 * An entry is one line in the files.
 */
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

self.createReadableStream = function () {
	var lineNumber = 0;
	var previousDigest;
	var source = fs.createReadStream(self.path);
	var audit = new stream.Transform({ 
		objectMode: true,
		transform: function(chunk, encoding, done) {
			var transform = this;
			if (transform.inError)
				return done();
			var data = chunk.toString();
			if (transform._lastLineData) data = transform._lastLineData + data;
		 
			var lines = data.split('\n');
			transform._lastLineData = lines.splice(lines.length-1,1)[0];
		 
			lines.forEach(function (line) { 
				try {
					if (transform.inError) return;
					lineNumber += 1;
					var o = JSON.parse(line);
					if (!o.digest)
						throw new Error("The digest is missing.");
					if (!o.audit)
						throw new Error("The audit information is missing.");
					if (!sally.verify(o.audit, o.digest, previousDigest))
						throw new Error("Evidence of tampering.");
					previousDigest = o.digest;
					transform.push(o);
				}
				catch (e) {
					transform.inError = true;
					transform.emit('error', new Error(self.path + ':' + lineNumber + ' ' + e.message));
				}
			});
			done();
		}
	});
	source.pipe(audit);
	return audit;
};

module.exports = function(opts)
{
	opts = opts || {};
	self.path = opts.path || 'sally.log';
	
	return self.init();
}
