'use strict';

var should = require('should');
var fs = require('fs');
var sally = require('../src/sally');
var filestore = require('../src/auditfile');
var auditlog = filestore();

describe('Audit file', function () {

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
			var count = 0;
			auditlog.path = 'sally-2.log';
			var stream = auditlog.createReadStream();
			stream.on('data', function (entry) {
				++count;
			});
			stream.on('end', function () {
				count.should.equal(2);
				done();
			});
		});
		
		it('should send error on bad JSON', function (done) {
			auditlog.path = 'sally-bad-1.log';
			if (fs.existsSync(auditlog.path))
				fs.unlinkSync(auditlog.path);
			fs.appendFileSync(auditlog.path, 'this is not JSON\n');
			var stream = auditlog.createReadStream();
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
			var stream = auditlog.createReadStream();
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
			var stream = auditlog.createReadStream();
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

		it('should process an empty log file', function (done) {
			auditlog.path = 'empty.log';
			var stream = auditlog.createReadStream();
			stream
				.on('data', function (d) {})
				.on('end', function () {
					done();
				});
		});

		it('should handle CRLFs or just newlines', function (done) {
			auditlog.path = 'sally-crlf.log';
			var count = 0;
			var stream = auditlog.createReadStream();
			stream
				.on('data', function (d) {++count})
				.on('end', function () {
					count.should.equal(2);
					done();
				});
		});

		it('should handle log without ending newline/CRLF', function (done) {
			auditlog.path = 'sally-without-trailing-newline.log';
			var count = 0;
			var stream = auditlog.createReadStream();
			stream
				.on('data', function (d) {++count})
				.on('end', function () {
					count.should.equal(2);
					done();
				});
		});

	});
});

