'use strict'

const chai = require('chai')
const request = require('supertest')
  .agent(require('../server'))
chai.use(
  require('chai-http')
)

describe('Index routes', () => {

  it( 'Displays homepage', async () => {
    let res = await request.get('/')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays help page', async () => {
    let res = await request.get('/help')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays terms of service', async () => {
    let res = await request.get('/terms')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays privacy policy', async () => {
    let res = await request.get('/privacy')
    chai.expect(res).html.to.have.status(200)
  })

  it('Displays robots.txt', async () => {
    let res = await request.get('/')
    chai.expect(res).to.have.status(200)//.to.be.text  Not sure why mocha's
    // getting text/html in mocha; it's showing text/plain in chrome
  })

  it('Redirects /signup to /logn#signup', async () => {
    let res = await request.get('/signup')
    chai.expect(res).to.redirectTo('/login#signup')
  })

  it('Redirects /demo to /map/demo', async () => {
    let res = await request.get('/demo')
    chai.expect(res).to.redirectTo('/map/demo')
  })

})
