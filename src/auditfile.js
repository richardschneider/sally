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
function SallyAuditFile(opts)
{
	var self = this;
	this.sally = require('./sally');
	
	opts = opts || {};
	this.path = opts.path || 'sally.log';
	this.onLog = this.onLog.bind(this);
	this.onEpochStart = this.onEpochStart.bind(this);
	this.onEpochEnd = this.onEpochEnd.bind(this);
	this.onCycleStart = this.onCycleStart.bind(this);
	this.onCycleEnd = this.onCycleEnd.bind(this);
	this.sally
		.on('log', this.onLog)
		.on('epochStart', this.onEpochStart)
		.on('epochEnd', this.onEpochEnd)
		.on('cycleStart', this.onCycleStart)
		.on('cycleEnd', this.onCycleEnd);
}

SallyAuditFile.prototype.onLog = function (audit, digest) {
	var entry = {
		audit: audit,
		digest: digest
	};
	fs.appendFileSync(this.path, encode(entry));
};

SallyAuditFile.prototype.onEpochStart = function (epoch) {
};

SallyAuditFile.prototype.onEpochEnd = function (epoch) {
};

SallyAuditFile.prototype.onCycleStart = function (cycle) {
};

SallyAuditFile.prototype.onCycleEnd = function (cyle) {
};

SallyAuditFile.prototype.close = function () {
	this.sally.removeListener('log', this.onLog);
	this.sally.removeListener('epochStart', this.onEpochStart);
	this.sally.removeListener('epochEnd', this.onEpochEnd);
	this.sally.removeListener('cycleStart', this.onCycleStart);
	this.sally.removeListener('cycleEnd', this.onCycleEnd);
};

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

SallyAuditFile.prototype.createReadStream = function () {
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
				if (!self.sally.verify(entry.audit, entry.digest, previousDigest))
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
	return fs.createReadStream(this.path, { encoding: 'utf8' })
		.pipe(split())
		.pipe(audit);
};

module.exports = SallyAuditFile;
