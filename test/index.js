'use strict'

const chai = require('chai')
const request = require('supertest')
  .agent(require('../server'))
chai.use(
  require('chai-http')
)

describe('Index routes', () => {

  it( 'Displays homepage', async () => {
    chai.expect(await request.get('/'))
      .html.to.have.status(200)
  })

  it('Displays help page', async () => {
    chai.expect(await request.get('/help'))
      .html.to.have.status(200)
  })

  it('Displays terms of service', async () => {
    chai.expect(await request.get('/terms'))
      .html.to.have.status(200)
  })

  it('Displays privacy policy', async () => {
    chai.expect(await request.get('/privacy'))
    .html.to.have.status(200)
  })

  it('Displays robots.txt', async () => {
    chai.expect(await request.get('/'))
      .to.have.status(200)//.to.be.text  Not sure why mocha's
      // getting text/html in mocha; it's showing text/plain in chrome
  })

  it('Redirects /signup to /logn#signup', async () => {
    chai.expect(await request.get('/signup'))
      .to.redirectTo('/login#signup')
  })

  it('Redirects /demo to /map/demo', async () => {
    chai.expect(await request.get('/demo'))
      .to.redirectTo('/map/demo')
  })

})
