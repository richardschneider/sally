'use strict';

var should = require('should');
var uuid = require('uuid');
var sally = require('../lib/sally');

describe('Cycle', function () {
	it('should emit cycleStart when starting', function (done) {
		sally.once('cycleStart', function() {done()} );
		sally.startCycle();
	});

	it('should emit cycleEnd when ending', function (done) {
		sally.once('cycleEnd', function() {done()} );
		sally.startCycle();
		sally.endCycle();
	});

	it('should have an uuid as the id', function (done) {
		sally.once('cycleStart', function(cycle) {
			cycle.should.have.property('id');
			cycle.id.should.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
			done()
		});
		sally.startCycle();
	});

	it('should have a UTC relative start time', function (done) {
		sally.once('cycleStart', function(cycle) {
			cycle.should.have.property('startTime');
			cycle.startTime.should.endWith('Z');
			done()
		});
		sally.startCycle();
	});

	it('should have a UTC relative end time', function (done) {
		sally.once('cycleEnd', function(cycle) {
			cycle.should.have.property('endTime');
			cycle.endTime.should.endWith('Z');
			done()
		});
		sally.startCycle();
		sally.endCycle();
	});
	
	it('should have maximum number of epochs', function (done) {
		sally.endCycle('start a new test');
		sally.once('cycleEnd', function(cycle) {
			cycle.should.have.property('epochCount');
			cycle.epochCount.should.equal(2);
			done();
		});
		sally.startCycle({ maxEpochs: 2});
		sally.startEpoch({ maxRecords: 1});
		sally.log('1');
		sally.startEpoch({ maxRecords: 1});
		sally.log('2');
	});

	it('should have a time to live', function (done) {
		sally.once('cycleStart', function(cycle) {
			cycle.should.have.property('ttl');
			cycle.ttl.should.equal('100ms');
			done();
		});
		sally.startCycle({ ttl: '100ms'});
	});

	it('should end after TTL', function (done) {
		sally.endCycle('start a new test');
		sally.once('cycleEnd', function(cycle) {
			cycle.should.have.property('epochCount', 0);
			cycle.should.have.property('ttl', '10ms');
			cycle.should.have.property('endReason', 'ttl expired');
			done();
		});
		sally.startCycle({ ttl: '10ms'});
	});

});

