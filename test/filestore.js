'use strict';

var should = require('should');
var fs = require('fs');
var sally = require('../src/sally');
var filestore = require('../src/filestore');
var auditlog = filestore();

describe('Filestore', function () {

    it('should default to "sally.log"', function (done) {
		auditlog.path.should.equal('sally.log');
        done();
    });

	it('should create the audit log if not present', function (done) {
		if (fs.existsSync(auditlog.path))
			fs.unlinkSync(auditlog.path);
		sally.log("hello world");
		fs.existsSync(auditlog.path).should.be.true;
		done();
	});
	
});

