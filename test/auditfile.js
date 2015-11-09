'use strict';

var should = require('should');
var fs = require('fs');
var sally = require('../src/sally');

describe('Audit trail', function () {
	var auditlog;
	
	beforeEach(function (done) {
		sally.configure({
			secret: 'xyzzy'
		});
		sally.endCycle('starting audit test');
		if (fs.existsSync('audit-test.sal'))
			fs.unlinkSync('audit-test.sal');
		auditlog = new sally.auditTrail();
        done();
	});
	
	afterEach(function (done) {
		sally.endCycle('testing finished');
		auditlog.close();
		if (fs.existsSync(auditlog.path))
			fs.unlinkSync(auditlog.path);
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
		var log = new sally.auditTrail();
		sally.startCycle();
		sally.log('line 1');
		sally.log('line 2');
		log.close();
		sally.log('line 3');
		sally.log('line 4');
		
		var i;
		var count = 0;
		fs.createReadStream(log.path)
		  .on('data', function(chunk) {
			for (i=0; i < chunk.length; ++i)
			  if (chunk[i] == 10) count++;
		  })
		  .on('end', function() {
		    count.should.equal(2 + 1);
			fs.unlinkSync(log.path);
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

	it('should have a new name for a new cycle', function (done) {
		var a = auditlog.path;
		sally.startCycle();
		a.should.not.equal(auditlog.path);
		done();
	});
	
	describe('Streaming', function() {
	
		it('should stream entries as an object', function (done) {
			var count = 0;
			sally
				.log('alpha')
				.log('beta')
				.createReadStream(auditlog.path)
				.on('data', function (entry) {
					++count;
				})
				.on('end', function () {
					count.should.equal(2 + 1);
					done();
				});
		});
		
		it('should send error on bad JSON', function (done) {
			fs.appendFileSync(auditlog.path, 'this is not JSON');
			auditlog
				.createReadStream()
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
			sally
				.createReadStream('sally-bad.log', 'this is not a secure secret')
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
			sally
				.createReadStream('sally-bad.log', 'this is not a secure secret')
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
			sally
				.createReadStream('empty.log', 'this is not a secure secret')
				.on('data', function (d) {})
				.on('end', function () {
					done();
				});
		});

		it('should handle CRLFs or just newlines', function (done) {
			var count = 0;
			sally
				.createReadStream('sally-crlf.log', 'this is not a secure secret')
				.on('data', function (d) {++count})
				.on('end', function () {
					count.should.equal(2);
					done();
				});
		});

		it('should handle log without ending newline/CRLF', function (done) {
			var count = 0;
			sally
				.createReadStream('sally-without-trailing-newline.log', 'this is not a secure secret')
				.on('data', function (d) {++count})
				.on('end', function () {
					count.should.equal(1);
					done();
				});
		});

	});
});

