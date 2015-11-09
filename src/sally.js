'use strict';

var crypto = require('crypto');
var uuid = require('uuid');
var process = require('process');
var durationParse = require('parse-duration');
var os = require('os');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var config = {};
var cycle;
var epoch;

function Sally(opts) {
    // Initialize necessary properties from `EventEmitter` in this instance
    EventEmitter.call(this);
	this.configure(opts);
}
util.inherits(Sally, EventEmitter);

Sally.prototype.configure = function (opts) {
    opts = opts || {};
    config.hash = opts.hash || config.hash || 'sha256';
    var s = opts.secret || config.secret || process.env.SallySecret;
	if (s && s != '' && s != 'undefined')
		config.secret = s;
};

var self = module.exports = new Sally();

self.removeSecret = function () {
	delete config.secret;
};

/**
 * Create a new audit trail file.
 *
 *    new sally.auditTrial({ path: 'my-secure.log' })
 */
self.auditTrail = require('./writer');

self.createReadStream = require('./reader');

/**
 * Adds the sally logger to the express pipeline.
 *
 * app.use(sally.express({ ... })
 */
self.express = require('./express');

/**
 * Internal method to sign an audit entry.
 */
 self.sign = function (audit, prevDigest, secret) {
	secret = secret || config.secret || undefined;
	if (!secret)
		throw new Error('The secret is missing');
    if (typeof audit === 'object')
        audit = JSON.stringify(audit);
	if (!prevDigest) {
		prevDigest = crypto
			.createHmac(config.hash, secret)
			.update('')
			.digest('base64');
	};
        
    return crypto
		.createHmac(config.hash, secret)
        .update(audit)
        .update(prevDigest)
        .digest('base64');
};

/**
 * Verifies that the audit information has not been tampered with.
 */
self.verify = function (audit, digest, prevDigest, secret) {
    return digest == self.sign(audit, prevDigest, secret);
};

/**
 * Adds a record into the audit.
 * 
 * Signs the audit information and then emits the 'log' event.  Audit logs
 * can then append the audit information to their log.
 */
self.log = function(audit) {
	if (!epoch) self.startEpoch();
	epoch.recordCount += 1;	
    
    self.emit("log", audit);
	
	if (epoch.maxRecords <= epoch.recordCount)
		self.endEpoch('maximum number of records reached');
		
	return this;
};

/**
 * Starts a new epoch.
 */
 self.startEpoch = function(opts) {
	self.endEpoch('starting a new epoch');
	if (!cycle) self.startCycle();
	cycle.epochCount += 1;
	
	opts = opts || {};
	epoch = {
		id: cycle.epochCount,
		cycle: cycle,
		startTime: new Date().toISOString(),
		maxRecords: opts.maxRecords || 1024,
		ttl: opts.ttl || '1m',
		recordCount: 0
	};
	
	var ttl = durationParse(epoch.ttl);
	setTimeout(function () {
		self.endEpoch('ttl expired');
	}, ttl);
	self.emit("epochStart", epoch);
	return epoch;
 }
 
 self.endEpoch = function(reason) {
	if (!epoch) return 0;
	
	epoch.endTime = new Date().toISOString();
	epoch.endReason = reason;
	self.emit("epochEnd", epoch);

	if (cycle && cycle.maxEpochs <= cycle.epochCount)
		self.endCycle('max epochs per cycle reached');
		
	epoch = undefined;
 }
 
/**
 * Starts a new cycle.
 */
 self.startCycle = function(opts) {
	self.endCycle('starting a new cycle');
	opts = opts || {};
	cycle = {
		id: uuid.v4(),
		hash: config.hash,
		startTime: new Date().toISOString(),
		maxEpochs: opts.maxEpochs || 20,
		ttl: opts.ttl || '20m',
		epochCount: 0
	};
	
	var ttl = durationParse(cycle.ttl);
	setTimeout(function () {
		self.endCycle('ttl expired');
	}, ttl);
	self.emit("cycleStart", cycle);
	return cycle;
 }
 
 self.endCycle = function(reason) {
	if (!cycle) return 0;
	
	var prevCycle = cycle;
	cycle = undefined;
	
	self.endEpoch(reason);
	
	prevCycle.endTime = new Date().toISOString();
	prevCycle.endReason = reason;
	self.emit("cycleEnd", prevCycle);
 }

process.on('exit', function (code) {
	self.endCycle('process exit with ' + code);
});
