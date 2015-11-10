'use strict';

var should = require('should');
var sally = require('../lib/sally');

describe('Epoch', function () {
	it('should emit epochStart when starting', function (done) {
		sally.once('epochStart', function() {done()} );
		sally.startEpoch();
	});

	it('should emit epochEnd when ending', function (done) {
		sally.once('epochEnd', function() {done()} );
		sally.startEpoch();
		sally.endEpoch();
	});

	it('should have a UTC relative start time', function (done) {
		sally.once('epochStart', function(epoch) {
			epoch.should.have.property('startTime');
			epoch.startTime.should.endWith('Z');
			done()
		});
		sally.startEpoch();
	});

	it('should have a UTC relative end time', function (done) {
		sally.once('epochEnd', function(epoch) {
			epoch.should.have.property('endTime');
			epoch.endTime.should.endWith('Z');
			done()
		});
		sally.startEpoch();
		sally.endEpoch();
	});
	
	it('should have maximum number of records', function (done) {
		sally.endEpoch('start a new test');
		sally.once('epochEnd', function(epoch) {
			epoch.should.have.property('recordCount');
			epoch.recordCount.should.equal(3);
			done();
		});
		sally.startEpoch({ maxRecords: 3});
		sally.log('1');
		sally.log('2');
		sally.log('3');
	});

	it('should have a time to live', function (done) {
		sally.once('epochStart', function(epoch) {
			epoch.should.have.property('ttl');
			epoch.ttl.should.equal('100ms');
			done();
		});
		sally.startEpoch({ ttl: '100ms'});
	});

	it('should end after TTL', function (done) {
		sally.endEpoch('start a new test');
		sally.once('epochEnd', function(epoch) {
			epoch.should.have.property('recordCount', 0);
			epoch.should.have.property('ttl', '10ms');
			epoch.should.have.property('endReason', 'ttl expired');
			done();
		});
		sally.startEpoch({ ttl: '10ms'});
	});

	it('should be contained in a cycle', function (done) {
		sally.endCycle('start a new test');
		sally.once('epochEnd', function(epoch) {
			epoch.should.have.property('cycle');
			done();
		});
		sally.startEpoch({ ttl: '10ms'});
	});

	it('should have an id starting at 1', function (done) {
		sally.endCycle('start a new test');
		
		sally.once('epochEnd', function(epoch) {
			epoch.should.have.property('id', 1);
			done();
		});
		sally.startEpoch({ ttl: '10ms'});
	});

	it('should have a monotonically increasing id', function (done) {
		sally.endCycle('start a new test');
		
		sally.startEpoch();
		sally.endEpoch();
		sally.startEpoch();
		sally.endEpoch();
		sally.startEpoch();
		sally.endEpoch();

		sally.once('epochEnd', function(epoch) {
			epoch.should.have.property('id', 4);
			done();
		});
		sally.startEpoch({ ttl: '10ms'});
	});

});

