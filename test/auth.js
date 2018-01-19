'use strict'

const chai = require('chai')
const app = require('../server')
const User = require('../config/models').user
// const superagent = require('superagent').agent()
const request = require('supertest').agent(app)
chai.use(
  require('chai-http')
)

// Import test config by object destructuring
const { FAKE_EMAIL, TEST_EMAIL,
  TEST_PASSWORD, BAD_PASSWORD,
  FUZZED_EMAIL_TRIES, FUZZED_PASSWORD_TRIES,
} = require('../config/test.js')

describe('Authentication', () => {

  describe('Account creation', () => {
    let passwordless_user

    // Make sure test user doesn't exist
    before( (done) => {
      User.findOne({'email':TEST_EMAIL})
      .then( (user) => {
        if (!user) done()
        else {
          user.remove()
          .then( (user) => { done() })
          .catch(console.error)
        }
      }).catch(console.error)
    })

    // These tests require the test user to have been created
    after( () => {
      console.log('running after tests')

      describe('Logged out', () => {

        it('Fails to log in with bad password', async () => {

          // Confirm redirect
          chai.expect( await request.post('/login')
            .type('form').send({
              'email': TEST_EMAIL,
              'password': BAD_PASSWORD
            })
          ).to.redirectTo('/login')  // Hey! Incorrect email or password.

        })

        // TODO: Implement fuzzer
        it.skip(`Fails to log in with ${FUZZED_PASSWORD_TRIES} fuzzed passwords`, () => {

          // Fuzz passwords
          // loop with let fuzzed_password

           // Confirm redirect
            // chai.expect( await request.post('/login')
            //   .type('form').send({
            //     'email': TEST_EMAIL,
            //     'password': fuzzed_password
            //   })
            // ).to.redirectTo('/login') // Hey! Incorrect email or password.

        })

        it('Logs in with password', async () => {
          let res = await request.post('/login')
            .type('form').send({
              email: TEST_EMAIL,
              password: TEST_PASSWORD
            })
          request.saveCookies(res)
          chai.expect(res).to.redirectTo('/map')
        })

        // it('Forgets password', async () => {

        // })

        // it('Changes forgotten password', async () => {

        // })

      })

      describe('Logged in', () => {

        it('Logs out', async () => {
          let res = request.get('/logout')
          request.attachCookies(res)
          chai.expect(res).to.redirectTo('/')

        })

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

    it('Fails to create an account with a fake email', async () => {

      // Confirm redirect
      chai.expect( await request.post('/signup')
        .type('form').send({ 'email':FAKE_EMAIL })
      ).to.redirectTo('/login#signup')

      /* Ensure user was deleted after email failed to send
      /* Users with bad emails are removed asynchronously and may happen after
      /* the response was recieved. Ensure it's happened in a kludgy way by
      /* waiting 2 seconds before asserting that the user doesn't exist
      */
      setTimeout( async () => {
        chai.assert.isNull( await User.findOne({
          'email': FAKE_EMAIL
        }), 'Account with fake email was created')
      }, 2000)

    })

    // TODO: Implement fuzzer
    it.skip(`Fails to create accounts with ${FUZZED_EMAIL_TRIES} fuzzed emails`, () => {

      // Fuzz emails
      // loop with let fuzzed_email

        // Confirm redirect
        // chai.expect( await request.post('/signup')
        //   .type('form').send({ 'email':fuzzed_email  })
        // ).to.redirectTo('/login#signup')

      /* Ensure user was deleted after email failed to send
      /* Users with bad emails are removed asynchronously and may happen after
      /* the response was recieved. Ensure it's happened in a kludgy way by
      /* waiting 2 seconds before asserting that the user doesn't exist
      */
      // setTimeout( async () => {
      //   chai.assert.isNull( await User.findOne({
      //     'email': FAKE_EMAIL
      //   }), 'Account with fake email was created')
      // }, 2000)

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

})
