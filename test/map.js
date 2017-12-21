const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const server = require('../server')
chai.use(chaiHttp)

// Ensure server is ready
before((done) => { server.on('ready', done) })

describe('Mapping', () => {

  it('Displays demo map', async () => {
    let res = await request(server).get('/map/demo')
    chai.expect(res).to.have.status(200).to.be.html
  })

  // TODO: it('Shows own map', async () => {
  //   request(server).get('/map')
  //   .expect(200)
  //   .end(function(err,res){ done(); })
  // })

  // TODO: it('Sets own location', async () => {

  // })

  // TODO: it('Tracks own location', async () => {

  // })

  // TODO: it('Clears own location', async () => {

  // })

  // TODO: it('Deletes account', async () => {

  // })

})