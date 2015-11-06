'use strict';

var should = require('should');
var fs = require('fs');
var sally = require('../src/sally');

describe('Audit trail', function () {
	var auditlog;
	
	before(function (done) {
		auditlog = new sally.auditTrail();
        done();
	});
	
	after(function (done) {
		auditlog.close();
        done();
	});
	
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
	
	it('should allow data with newlines', function (done) {
		sally.log("hello 1\nhello 2");
		var stream = auditlog.createReadStream();
		stream
			.on('data', function (entry) {})
			.on('end', function () { done() });
	});
	
	it('should not record entries when closed', function (done) {
		var path = 'closed.log';
		if (fs.existsSync(path))
			fs.unlinkSync(path);
		var log = new sally.auditTrail({path: path});
		sally.startCycle();
		sally.log('line 1');
		sally.log('line 2');
		log.close();
		sally.log('line 3');
		
		var i;
		var count = 0;
		fs.createReadStream(path)
		  .on('data', function(chunk) {
			for (i=0; i < chunk.length; ++i)
			  if (chunk[i] == 10) count++;
		  })
		  .on('end', function() {
		    count.should.equal(2);
			done();
		  });
	});
	
	it('should allow data with backslashes', function (done) {
		sally.log("c:\\temp\\log");
		var stream = auditlog.createReadStream();
		stream
			.on('data', function (entry) {})
			.on('end', function () { done() });
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
			fs.appendFileSync(auditlog.path, 'this is not JSON');
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
					count.should.equal(1);
					done();
				});
		});

	});
});

