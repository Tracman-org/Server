const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const server = require('./server')
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
