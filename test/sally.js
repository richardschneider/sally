'use strict';

var should = require('should');
var sally = require('../src/sally');

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

});

describe('Crypto', function () {
    var d1 = sally.sign('a');
    var d2 = sally.sign('b', d1);
    var d3 = sally.sign('c', d2);

    it('should pass an untampered log', function (done) {
        sally.verify('a', d1).should.be.true;
        sally.verify('b', d2, d1).should.be.true;
        sally.verify('c', d3, d2).should.be.true;
        done();
    });
   
    it('should fail when audit line tampered', function (done) {
        sally.verify('aX', d1).should.be.false;
        sally.verify('bX', d2, d1).should.be.false;
        sally.verify('cX', d3, d2).should.be.false;
        done();
    });

    it('should fail when audit line and digest tampered', function (done) {
        var d2X = sally.sign('bX', d1);
        sally.verify('a', d1).should.be.true;
        sally.verify('bX', d2X, d1).should.be.true;
        sally.verify('c', d3, d2X).should.be.false;
        done();
    });

    it('should fail when 1st audit line and digest tampered', function (done) {
        var d1X = sally.sign('aX');
        sally.verify('aX', d1X).should.be.true;
        sally.verify('b', d2, d1X).should.be.false;
        done();
    });

    it('should detect a deleted audit line', function (done) {
        sally.verify('a', d1).should.be.true;
        sally.verify('c', d3, d1).should.be.false;
        done();
    });

    it('should detect the 1st audit line is deleted', function (done) {
        sally.verify('b', d2).should.be.false;
        done();
    });
    
    it('should sign and verify objects', function (done) {
        var x = { who: 'emanon', where: 'erehwon' };
        var y = { who: 'emanon', where: 'erehwon' };
        var z = { who: 'noname', where: 'nowhere' };
        
        sally.verify(x, sally.sign(x)).should.be.true;
        sally.verify(x, sally.sign(y)).should.be.true;
        sally.verify(x, sally.sign(z)).should.be.false;
        done();
    });

});

