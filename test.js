var chai = require('chai'),
	chaiHttp = require('chai-http'),
	request = require('supertest'),
	server = require('./server'),
	should = chai.should();
chai.use(chaiHttp);

describe('Index', function() {
	// var server;
	// beforeEach(function() {
	// 	server = require('./server');
	// });
	// afterEach(function() {
	// 	server.close();
	// });
	
	it('Displays homepage', function(done){
		request(server).get('/')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	it('Displays robots.txt', function(done){
		request(server).get('/robots.txt')
		.expect(200)
		.expect('Content-Type', /text/)
		.end(function(err,res){ done(); });
	});
	
	it('Displays example map', function(done){
		request(server).get('/map/keith')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	// it('Can\'t set location on example map', function(done){
	// 	//TODO: Check websocketssecurity
	// 	done();
	// });
	
	it('Sends invite request', function(done){
		request(server).post('/')
			.send({
				"name":"Mocha Test",
				"email":"mocha@example.com",
				"why":"Because I really really want it. "
			})
			.expect(200)
			.end(function(err, res) {
				if (err){ done(err); }
				else { done(); }
			});
	});
	
});

describe('Auth', function() {
	
	//TODO: it 'Gets invited, creates an account'
	
	//TODO: it 'Logs out'
	
	//TODO: it 'Logs in'
	
	//TODO: it 'Shows own map'
	
});

describe('Map controls', function() {
	
	//TODO: it 'Sets location'
	
	//TODO: it 'Clears location'
	
	//TODO: it 'Starts tracking'
	
	//TODO: it 'Stops tracking'
	
});

describe('Map popups', function() {
	
	//TODO: it 'Opens Share popup'
	
	//TODO: it 'Closes Share popup'
	
	//TODO: it 'Opens Settings popup'
	
	//TODO: it 'Closes Settings popup'
	
});