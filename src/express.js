'use strict';

var onFinished = require('on-finished');
var os = require('os');
var sally = require('./sally');

var config = {};

/*
 * app.use(sally.express({ ... })
 */
module.exports  = function (opts) {
    opts = opts || {};
    config.methods = opts.methods || ['POST', 'PUT', 'DELETE', 'PATCH'];
    config.user = opts.user || function() { return 'anonymous'; };
    config.hostname = opts.hostname || os.hostname();
	
	opts.path = opts.path || 'express.sal';
	new sally.auditTrail(opts);
    return logger;
}

/**
 * Generates audit record for every request that creates/modifies a resource.
 */
function logger (req, res, next) {
    var now = new Date();

    function logRequest()
    {
        var ok = 200 <= res.statusCode && res.statusCode <= 400;
        if (ok && config.methods.indexOf(req.method) < 0)
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
            what: (req.method == 'POST') ? res._headers['location'] : req.url,
            status: res.statusCode,
        };
        sally.log(audit);
    }
    
    onFinished(res, logRequest);
    next();
};
