'use strict'

const chai = require('chai')
const request = require('supertest')
  .agent(require('../server'))
chai.use(
  require('chai-http')
)

describe('Mapping', () => {

  it('Displays demo map', async () => {
    chai.expect(await request.get('/map/demo'))
      .to.have.status(200).to.be.html
  })

  // TODO: it('Shows own map', async () => {
  //   request.get('/map')
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
