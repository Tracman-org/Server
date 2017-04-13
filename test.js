const chai = require('chai'),
	chaiHttp = require('chai-http'),
	request = require('supertest'),
	server = require('./server');
chai.use(chaiHttp);


describe('Pages', function() {
	
	it('Displays homepage', function(done){
		request(server).get('/')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	it('Displays help page', function(done){
		request(server).get('/help')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	it('Displays terms of service', function(done){
		request(server).get('/terms')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	it('Displays privacy policy', function(done){
		request(server).get('/privacy')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	it('Displays robots.txt', function(done){
		request(server).get('/robots.txt')
		.expect(200)
		.expect('Content-Type', /text/)
		.end(function(err,res){ done(); });
	});
	
	it('Displays demo map', function(done){
		request(server).get('/map/keith')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
});

describe('Auth', function() {
	
	it('Creates an account', function(done){
		request(server).post('/signup',{"email":"test@tracman.org"})
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
	//TODO: it('Has the correct account info', function(done){
		
	// });
	
	//TODO: it('Logs out', function(done){
		
	// });
	
	//TODO: it('Logs in', function(done){
		
	// });
	
	//TODO: it('Shows own map', function(done){
		
	// });
	
	//TODO: it('Deletes account', function(done){
		
	// });
	
// });

// describe('Map controls', function() {
	
	//TODO: it('Sets location', function(done){
		
	// });
	
	//TODO: it('Clears location', function(done){
		
	// });
	
	//TODO: it('Starts tracking', function(done){
		
	// });
	
	//TODO: it('Stops tracking', function(done){
		
	// });
	
// });

