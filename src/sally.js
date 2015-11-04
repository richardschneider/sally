'use strict';

var crypto = require('crypto');
var onFinished = require('on-finished');
var os = require('os');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var config = {};
var noDigest;
var previousDigest;

function Sally(opts) {
    // Initialize necessary properties from `EventEmitter` in this instance
    EventEmitter.call(this);

    opts = opts || {};
    config.hash = opts.hash || 'sha256';
    config.secret = opts.secret || 'this is not a secure secret';
    config.auditMethods = opts.auditMethods || ['POST', 'PUT', 'DELETE', 'PATCH'];
    config.user = opts.user || function() { return 'anonymous'; };
    config.hostname = opts.hostname || os.hostname();
    
    noDigest = crypto.createHmac(config.hash, config.secret)
        .update('')
        .digest('base64');
    
    return this;
}
util.inherits(Sally, EventEmitter);

var self = module.exports = new Sally();

self.options = config;

/**
 * Create a new audit trail file.
 *
 *    new sally.auditTrial({ path: 'my-secure.log' })
 */
self.auditTrail = require('./auditfile');


/**
 * Adds the sally logger to the express pipeline.
 * 
 * It generates audit record for every request that creates/modifies a resource.
 */
self.logger = function (req, res, next){
    var now = new Date();

    function logRequest()
    {
        var ok = 200 <= res.statusCode && res.statusCode <= 400;
        if (ok && config.auditMethods.indexOf(req.method) < 0)
            return;
            
        var audit = {
            who: config.user(req),
            when: now.toISOString(),
            where: {
                client: req.ip
                    || req._remoteAddress
                    || (req.connection && req.connection.remoteAddress)
                    || undefined,
                server: config.hostname
                },
            why: req.method,
            what: (req.method == 'POST') ? res.header['Location'] : req.url,
            status: res.statusCode,
        };
        self.log(audit);
    }
    
    onFinished(res, logRequest);
    next();
};

/**
 * Internal method to sign an audit entry.
 */
 self.sign = function (audit, prevDigest) {
    if (typeof audit === 'object')
        audit = JSON.stringify(audit);
    if (!prevDigest)
        prevDigest = noDigest;
        
    return crypto.createHmac(config.hash, config.secret)
        .update(audit)
        .update(prevDigest)
        .digest('base64');
};

/**
 * Verifies that the audit information has not been tampered with.
 */
self.verify = function (audit, digest, prevDigest) {
    return digest == self.sign(audit, prevDigest);
};

/**
 * Adds a entry into the audit.
 * 
 * Signs the audit information and then emits the 'log' event.  Audit logs
 * can then append the audit information to their log.
 */
self.log = function(audit) {
    previousDigest = self.sign(audit, previousDigest);
    self.emit("log", audit, previousDigest);
};

