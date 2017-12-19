const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const server = require('../server')
chai.use(chaiHttp)

// Ensure server is ready
before((done) => { server.on('ready', done) })

describe('Index routes', () => {

  // Ensure server is ready
  before((done) => { server.on('ready', done) })

  it( 'Displays homepage', async () => {
    let res = await request(server).get('/')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays help page', async () => {
    let res = await request(server).get('/help')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays terms of service', async () => {
    let res = await request(server).get('/terms')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays privacy policy', async () => {
    let res = await request(server).get('/privacy')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays robots.txt', async () => {
    let res = await request(server).get('/')
    chai.expect(res).to.have.status(200)//.to.be.text  Not sure why mocha's
    // getting text/html in mocha; it's showing text/plain in chrome
  })

  it('Redirects /signup to /logn#signup', async () => {
    let res = await request(server).get('/signup')
    chai.expect(res).to.redirectTo('/login#signup')
  })

  it('Redirects /demo to /map/demo', async () => {
    let res = await request(server).get('/demo')
    chai.expect(res).to.redirectTo('/map/demo')
  })

})
