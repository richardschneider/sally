'use strict';

/*
 * Writes to an audit trail that is a file.
 */
 
var fs = require('fs');
var os = require('os');

/**
 * AuditFile constructor.
 */
function SallyWriter(opts)
{
	var self = this;
	this.sally = require('./sally');
	
	opts = opts || {};
	this.path = opts.path || 'sally.log';
	this.digest = undefined;
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
		.on('cycleEnd', this.onCycleEnd)
		.configure(opts)
}

SallyWriter.prototype.onLog = function (audit) {
	this.digest = this.sally.sign(audit, this.digest); 
	var entry = {
		audit: audit,
		digest: this.digest
	};
	fs.appendFileSync(this.path, encode(entry));
};

SallyWriter.prototype.onEpochStart = function (epoch) {
};

SallyWriter.prototype.onEpochEnd = function (epoch) {
};

SallyWriter.prototype.onCycleStart = function (cycle) {
	this.digest = this.sally.sign(cycle, this.digest); 
	var entry = {
		cycle: cycle,
		digest: this.digest
	};
	fs.appendFileSync(this.path, encode(entry));
};

SallyWriter.prototype.onCycleEnd = function (cycle) {
	this.digest = this.sally.sign(cycle, this.digest); 
	var entry = {
		cycle: cycle,
		digest: this.digest
	};
	fs.appendFileSync(this.path, encode(entry));
	this.digest = undefined;
};

SallyWriter.prototype.close = function () {
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
	return JSON.stringify(entry) + os.EOL;
}

/* For our tests.  TODO they should be changed not to use thus function. */

SallyWriter.prototype.createReadStream = function () {
	var reader = require('./reader');
	return new reader({path: this.path})
		.createReadStream();
};

module.exports = SallyWriter;
