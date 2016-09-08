var chai = require('chai'),
	chaiHttp = require('chai-http'),
	request = require('supertest'),
	server = require('./server'),
	should = chai.should(),
	expect = chai.expect();
chai.use(chaiHttp);

describe('Index', function() {
	// I think this restarts the server after each try? 
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
	
	it('Displays demo map', function(done){
		request(server).get('/map/keith')
		.expect(200)
		.end(function(err,res){ done(); });
	});
	
});

describe('Auth', function() {
	
	it('Creates an account', function(done){
		request(server).get('/login')
			.expect(200)
			.end(function(err,res){
				//TODO: google authentication
				it('Logs out', function(done){
					request(server).get('/logout')
						.expect(200)
						.end(function(err,res){
							it('Logs in', function(done){
								request(server).get('/logout')
									.expect(200)
									.end(function(err,res){
										cbc=2;
										var deletesAccount = function(done){
											it('Deletes own account', function(){
												//TODO: Delete account via GUI
											});
										}
										it('Shows own map', function(done){
											request(server).get('/map')
												.expect(200)
												//TODO: Expect no js errors
												.end(function(err,res){
													if (cbc<2){ deletesAccount(); }
													else { cbc--; }
													done();
												});
										});
										
										it('Has the correct account info', function(done){
											//TODO: Check account info
											if (cbc<2){ deletesAccount(); }
											else { cbc--; }
											done();
										});
										
										done();
									});
							});
							done();
						});
				});
				done();
			});
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
	
});

describe('Map controls', function() {
	
	//TODO: it('Sets location', function(done){
		
	// });
	
	//TODO: it('Clears location', function(done){
		
	// });
	
	//TODO: it('Starts tracking', function(done){
		
	// });
	
	//TODO: it('Stops tracking', function(done){
		
	// });
	
});

describe('Map popups', function() {
	
	//TODO: it('Opens Share popup', function(done){
		
	// });
	
	//TODO: it('Closes Share popup', function(done){
		
	// });
	
	//TODO: it('Opens Settings popup', function(done){
		
	// });
	
	//TODO: it('Closes Settings popup', function(done){
		
	// });
	
});