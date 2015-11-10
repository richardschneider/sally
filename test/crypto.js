'use strict';

var should = require('should');
var sally = require('../lib/sally');
	
describe('Crypto', function () {
	var d1, d2, d3;
	
	before(function (done) {
		sally.configure({
			secret: 'xyzzy'
		});
		d1 = sally.sign('a');
		d2 = sally.sign('b', d1);
		d3 = sally.sign('c', d2);
		done();
	});
	

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

