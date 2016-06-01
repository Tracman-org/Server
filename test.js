var chai = require('chai'),
	chaiHttp = require('chai-http'),
	server = require('./server'),
	should = chai.should();
chai.use(chaiHttp);

describe('Routes', function() {

	it('Displays homepage', function(done){
	chai.request(server)
		.get('/')
		.end(function(err,res){
			res.should.have.status(200);
			done();
		});
	});
	it('Displays robots.txt', function(done){
	chai.request(server)
		.get('/robots.txt')
		.end(function(err,res){
			res.should.have.status(200);
			res.should.be.text;
			done();
		});
	});
	it('Displays a map', function(done){
	chai.request(server)
		.get('/map/keith')
		.end(function(err,res){
			res.should.have.status(200);
			done();
		});
	});

});
