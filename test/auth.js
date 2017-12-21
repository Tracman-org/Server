'use strict'

const chai = require('chai')
const User = require('../config/models').user
const request = require('supertest')
  .agent(require('../server'))
chai.use(
  require('chai-http')
)

// Constants for dummy accounts
const FAKE_EMAIL = 'nobody@tracman.org'
const TEST_EMAIL = 'test@tracman.org'
const TEST_PASSWORD = 'mDAQYe2VYE'
const BAD_PASSWORD = 'password123'

describe('Authentication', () => {

  describe('Account creation', () => {
    let passwordless_user

    // Make sure test user doesn't exist
    before( async () => {
      let existing_test_user = await User.findOne({'email':TEST_EMAIL})
      if (existing_test_user) existing_test_user.remove()
    })

    it('Fails to create an account with a fake email', async () => {

      // Confirm redirect
      chai.expect( await request.post('/signup')
        .type('form').send({ 'email':FAKE_EMAIL })
      ).to.redirectTo('/login#signup')

      // Ensure user was deleted after email failed to send
      // Users with bad emails are removed asynchronously and may happen after
      // the response was recieved. Ensure it's happened in a kludgy way by
      // waiting 2 seconds before asserting that the user doesn't exist
      setTimeout( async () => {
        chai.assert.isNull( await User.findOne({
          'email': FAKE_EMAIL
        }), 'Account with fake email was created')
      }, 2000)

    })

    it('Creates an account with a valid email', async () => {

      // Set email address
      chai.expect( await request.post('/signup')
        .type('form').send({ 'email':TEST_EMAIL })
      ).to.redirectTo('/login')

      // Assert that user was created
      passwordless_user = await User.findOne({'email':TEST_EMAIL})
      chai.assert.isDefined(passwordless_user, 'Failed to create account')

    })

    it('Loads password page', async () => {
      // Load password page
      chai.expect(await request
        .get(`/settings/password/${passwordless_user.auth.passToken}`)
      ).html.to.have.status(200)
    })

    it('Fails to set a weak password', async () => {
      chai.expect( await request
        .post(`/settings/password/${passwordless_user.auth.passToken}`)
        .type('form').send({ 'password':BAD_PASSWORD })
      ).to.redirectTo(`/settings/password/${passwordless_user.auth.passToken}`)
    })

    it('Sets a strong password', () => {

      // Set password
      return request
        .post(`/settings/password/${passwordless_user.auth.passToken}`)
        .type('form').send({ 'password':TEST_PASSWORD })
      .then( async (res) => {

        // Expect redirect
        chai.expect(res).to.redirectTo('/login?next=/map?new=1')

        // Retrieve user with password saved
        let passworded_user = await User.findOne({'email':TEST_EMAIL} )

        // Assert password was set
        chai.assert.isString(
          passworded_user.auth.password, 'Failed to correctly save password'
        )

      })

    })

  })

  describe('Account usage', () => {

    // Create account to play with
    before( () => {
      // Create user
      // Set password
    })

    // it('Logs in', async () => {

    // })

    // it('Logs out', async () => {

    // })

    // it('Forgets password', async () => {

    // })

    // it('Changes forgotten password', async () => {

    // })

    // it('Logs back in', async () => {

    // })

    // it('Changes email address', async () => {

    // })

    // it('Changes password', async () => {

    // })

    // it('Changes settings', async () => {

    // })

    // it('Connects a Google account', async () => {

    // })

    // it('Connects a Facebook account', async () => {

    // })

    // it('Connects a Twitter account', async () => {

    // })

    // it('Logs in with Google', async () => {

    // })

    // it('Logs in with Facebook', async () => {

    // })

    // it('Logs in with Twitter', async () => {

    // })

    // it('Disconnects a Google account', async () => {

    // })

    // it('Disconnects a Facebook account', async () => {

    // })

    // it('Disconnects a Twitter account', async () => {

    // })

  })

})
