'use strict';

var should = require('should');
var process = require('process');
var sally = require('../src/sally');

describe('Sally', function () {
	var log;
	before(function (done) {
		log = new sally.auditTrail();
		done();
	});
	
	after(function (done) {
		log.close();
		done();
	});

	it('should require a secret', function(done) {
		var x = process.env.SallySecret;
		try {
			process.env.SallySecret = undefined;
			sally.removeSecret();
			sally.log.bind(null, 'should be an error').should.throw('The secret is missing');
		} finally {
			process.env.SallySecret = x;
		}
		done();
	});

	it('should get a default secret from the environment variable SallySecret', function(done) {
		var x = process.env.SallySecret;
		try {
			sally.removeSecret();
			process.env.SallySecret = 'xxxxx';
			sally.configure();
			sally.log('should be ok');
		} finally {
			process.env.SallySecret = x;
		}
		done();
	});

	it('should accept secret from configuration option', function(done) {
		var x = process.env.SallySecret;
		try {
			process.env.SallySecret = undefined;
			sally.removeSecret();
			sally.configure({ secret: 'xxx' });
			sally.log('should be ok');
		} finally {
			process.env.SallySecret = x;
		}
		done();
	});

	});