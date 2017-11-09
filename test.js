const chai = require('chai'),
	chaiHttp = require('chai-http'),
	request = require('supertest'),
	server = require('./server');
chai.use(chaiHttp);


describe('Public Pages', () => {
	
	function getPublicPage(url,done){
		request(server.get(url)
		.expect(200)
		.end( (err,res)=>{ done(); } )
	}
	
	it('Displays homepage', (done) => {
		getPublicPage ('/', done)
	})
	
	it('Displays help page', (done) => {
		getPublicPage('/help',done)
	})
	
	it('Displays terms of service', (done) => {
		getPublicPage ('/terms',done)
	})
	
	it('Displays privacy policy', (done) => {
		getPublicPage ('/privacy', done)
	
	it('Displays robots.txt', done) => {
		request(server).get('/robots.txt')
		.expect(200)
		.expect('Content-Type', /text/)
		.end( (err,res) => { done(); } )
	})
	
	it('Displays demo map', (done) => {
		getPublicPage ('/demo', done)
	})
	
	it('Displays help page', (done) => {
		getPublicPage ('/help', done)
	})
	
})

describe('User', () => {
	
	it('Creates an account', (done) => {
		request(server).post('/signup',{"email":"test@tracman.org"})
		.expect(200)
		.end( (err,res) => { done(); } );
	});
	
	//TODO: it('Creates a password', (done) => {
		
	// });
	
	//TODO: it('Logs in', (done) => {
		
	// });
	
	//TODO: it('Logs out', (done) => {
		
	// });
	
	//TODO: it('Forgets password', (done) => {
		
	// });
	
	//TODO: it('Changes forgotten password', (done) => {
		
	// });
	
	//TODO: it('Logs back in', (done) => {
		
	// });
	
	//TODO: it('Changes email address', (done) => {
		
	// });
	
	//TODO: it('Changes password', (done) => {
		
	// });
	
	//TODO: it('Changes settings', (done) => {
		
	// });
	
	//TODO: it('Connects a Google account', (done) => {
		
	// });
	
	//TODO: it('Connects a Facebook account', (done) => {
		
	// });
	
	//TODO: it('Connects a Twitter account', (done) => {
		
	// });
	
	//TODO: it('Logs in with Google', (done) => {
		
	// });
	
	//TODO: it('Logs in with Facebook', (done) => {
		
	// });
	
	//TODO: it('Logs in with Twitter', (done) => {
		
	// });
	
	//TODO: it('Disconnects a Google account', (done) => {
		
	// });
	
	//TODO: it('Disconnects a Facebook account', (done) => {
		
	// });
	
	//TODO: it('Disconnects a Twitter account', (done) => {
		
	// });
	
	//TODO: it('Shows own map', (done) => {
	// 	request(server).get('/map')
	// 	.expect(200)
	// 	.end(function(err,res){ done(); });
	// });
	
	//TODO: it('Sets own location', (done) => {
		
	// });
	
	//TODO: it('Tracks own location', (done) => {
		
	// });
	
	//TODO: it('Clears own location', (done) => {
		
	// });
	
	//TODO: it('Deletes account', (done) => {
		
	// });
	
});
