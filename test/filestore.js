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
	
	describe('Streaming', function() {
	
		it('should stream entries as an object', function (done) {
			var hello2seen = false;
			sally.log("hello world 2");
			var stream = auditlog.createReadableStream();
			stream.on('data', function (entry) {
				if (entry.audit == 'hello world 2')
					hello2seen = true;
			});
			stream.on('end', function () {
				hello2seen.should.be.true;
				done();
			});
		});
		
		it('should send error on bad JSON', function (done) {
			auditlog.path = 'sally-bad-1.log';
			fs.appendFileSync(auditlog.path, 'this is not JSON\n');
			var stream = auditlog.createReadableStream();
			stream
				.on('data', function (d) {})
				.on('error', function (err) {
					done();
				})
				.on('end', function () {
					should.fail('error not emitted')
					done();
				});
		});

		it('should send error on tampering', function (done) {
			auditlog.path = 'sally-bad.log';
			var stream = auditlog.createReadableStream();
			stream
				.on('data', function (d) {})
				.on('error', function (err) {
					done();
				})
				.on('end', function () {
					should.fail('error not emitted')
					done();
				});
		});

		it('should include path and line # in an error', function (done) {
			auditlog.path = 'sally-bad.log';
			var stream = auditlog.createReadableStream();
			stream
				.on('data', function (d) {})
				.on('error', function (err) {
					err.message.should.startWith('sally-bad.log:2');
					done();
				})
				.on('end', function () {
					should.fail('error not emitted')
					done();
				});
		});

		});
});

