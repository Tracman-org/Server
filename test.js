const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const server = require('./server')
<<<<<<< HEAD
chai.use(chaiHttp)

describe('Public', function () {
  it('Displays homepage', function (done) {
    request(server).get('/')
    .expect(200)
    .end(function (err, res) { done() })
  })

  it('Displays help page', function (done) {
    request(server).get('/help')
    .expect(200)
    .end(function (err, res) { done() })
  })

  it('Displays terms of service', function (done) {
    request(server).get('/terms')
    .expect(200)
    .end(function (err, res) { done() })
  })

  it('Displays privacy policy', function (done) {
    request(server).get('/privacy')
    .expect(200)
    .end(function (err, res) { done() })
  })

  it('Displays robots.txt', function (done) {
    request(server).get('/robots.txt')
    .expect(200)
    .expect('Content-Type', /text/)
    .end(function (err, res) { done() })
  })

  it('Displays demo map', function (done) {
    request(server).get('/map/keith')
    .expect(200)
    .end(function (err, res) { done() })
  })
})

describe('User', function () {
  it('Creates an account', function (done) {
    request(server).post('/signup', {'email': 'test@tracman.org'})
    .expect(200)
    .end(function (err, res) { done() })
  })

  // TODO: it('Creates a password', function(done){

  // })

  // TODO: it('Logs in', function(done){

  // })

  // TODO: it('Logs out', function(done){

  // })

  // TODO: it('Forgets password', function(done){

  // })

  // TODO: it('Changes forgotten password', function(done){

  // })

  // TODO: it('Logs back in', function(done){

  // })

  // TODO: it('Changes email address', function(done){

  // })

  // TODO: it('Changes password', function(done){

  // })

  // TODO: it('Changes settings', function(done){

  // })

  // TODO: it('Connects a Google account', function(done){

  // })

  // TODO: it('Connects a Facebook account', function(done){

  // })

  // TODO: it('Connects a Twitter account', function(done){

  // })

  // TODO: it('Logs in with Google', function(done){

  // })

  // TODO: it('Logs in with Facebook', function(done){

  // })

  // TODO: it('Logs in with Twitter', function(done){

  // })

  // TODO: it('Disconnects a Google account', function(done){

  // })

  // TODO: it('Disconnects a Facebook account', function(done){

  // })

  // TODO: it('Disconnects a Twitter account', function(done){

  // })

  // TODO: it('Shows own map', function(done){
  //   request(server).get('/map')
  //   .expect(200)
  //   .end(function(err,res){ done(); })
  // })

  // TODO: it('Sets own location', function(done){

  // })

  // TODO: it('Tracks own location', function(done){

  // })

  // TODO: it('Clears own location', function(done){

  // })

  // TODO: it('Deletes account', function(done){

  // })
})
=======
const chai.use(chaiHttp);


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
	})

	it('Displays robots.txt', done) => {
		request(server).get('/robots.txt')
		.expect(200)
		.expect('Content-Type', /text/)
		.end( (err,res) => { done(); } )
	})
	
	it('Displays demo map', (done) => {
		getPublicPage ('/map/demo', done)
	})
	
	it('Displays help page', (done) => {
		getPublicPage ('/help', done)
	})
	
	it('Displays contact page', (done) => {
		getPublicPage('/contact', done)
	})
	
	
	
})

describe('Accounts', () => {
	
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
>>>>>>> 72141a31873b674ed23daf262ce14be38dda50ff
