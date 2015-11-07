var should = require('should');
var sally = require('../src/sally');
var server = require('./server');
var request = require("supertest");

describe('Express logging middleware', function () {

	var something = { name: 'something' };
    var somethingUrl;

	it('should log the 5Ws', function (done) {
        sally.once('log', function(audit) {
			audit.should.have.property('who', 'anonymous');
			audit.should.have.property('when');
			audit.when.should.endWith('Z');
			audit.should.have.property('where');
			audit.where.should.have.property('client');
			audit.where.should.have.property('server');
			audit.should.have.property('why', 'POST');
			audit.should.have.property('what', '/something/1');
			done();
		});
        request(server)
            .post('/something')
            .send(something)
            .expect(201)
			.end();
	});
	
    it('should log on POST', function (done) {
        var sallyEmit = false;
        sally.once('log', function(audit) {
            audit.why.should.equal('POST');
            sallyEmit = true;
        });

        request(server)
            .post('/something')
            .send(something)
            .expect(201)
            .expect(function (res) {
                somethingUrl = res.header['location'];
            })
            .expect(function () {
                sallyEmit.should.be.true;
            })
            .end(done);
    });

    
    it('should not log on GET', function (done) {
        var sallyEmit = false;
        sally.once('log', function(audit) {
            sallyEmit = true;
        });

        request(server)
            .get(somethingUrl)
            .expect(200)
            .expect(function () {
                sallyEmit.should.be.false;
            })
            .end(done);
    });

    
    it('should log on GET failure', function (done) {
        var sallyEmit = false;
        sally.once('log', function(audit) {
			audit.should.have.property('why', 'GET');
			audit.should.have.property('what', '/something/unknown');
            sallyEmit = true;
        });

        request(server)
            .get('/something/unknown')
            .expect(404)
            .expect(function () {
                sallyEmit.should.be.true;
            })
            .end(done);
    });
    
});