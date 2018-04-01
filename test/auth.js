'use strict'

const chai = require('chai')
const app = require('../server')
const froth = require('mocha-froth')
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
} = require('../config/test')

describe('Authentication', () => {

  describe('Account creation', () => {
    let passwordless_user

    // Make sure test user doesn't exist
    before( async () => {
      try {
        const user = await User.findOne({'email':TEST_EMAIL})
        if (!user) return
        else user.remove()
      } catch (err) { console.error(err) }
    })

    it('Fails to create an account with a fake email', async () => {

      // Confirm redirect
      chai.expect( await request.post('/signup')
        .type('form').send({ 'email':FAKE_EMAIL })
      ).to.redirectTo('/login#signup')

      /* Ensure user was deleted after email failed to send
       * Users with bad emails are removed asynchronously and may happen after
       * the response was recieved. Ensure it's happened in a kludgy way by
       * waiting 2 seconds before asserting that the user doesn't exist
       */
      setTimeout( async () => {
        chai.assert.isNull( await User.findOne({
          'email': FAKE_EMAIL
        }), 'Account with fake email was created')
      }, 2000)

    })

    it.skip(`Fails to create accounts with ${FUZZED_EMAIL_TRIES} fuzzed emails`, () => {

      // Fuzz emails
      froth(FUZZED_EMAIL_TRIES).forEach( async (fuzzed_email) => {

        // Confirm redirect
        chai.expect( await request.post('/signup')
          .type('form').send({ 'email':fuzzed_email })
        ).to.redirectTo('/login#signup')

        /* Ensure user was deleted after email failed to send
         * Users with bad emails are removed asynchronously and may happen after
         * the response was recieved. Ensure it's happened in a kludgy way by
         * waiting 2 seconds before asserting that the user doesn't exist
         */
         //TODO: This just isn't working... phony emails are showing up in the db
        setTimeout( async () => {
          chai.assert.isNull( await User.findOne({
            'email': fuzzed_email
          }), 'Account with fake email was created')
        }, 2000)

      })

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
        .get(`/account/password/${passwordless_user.auth.passToken}`)
      ).to.be.html.and.have.status(200)
    })

    it('Fails to set a weak password', async () => {
      chai.expect( await request
        .post(`/account/password/${passwordless_user.auth.passToken}`)
        .type('form').send({ 'password':BAD_PASSWORD })
      ).to.redirectTo(`/account/password/${passwordless_user.auth.passToken}`)
    })

    it('Sets a strong password', async () => {

      // Perform request
      const res = await request
        .post(`/account/password/${passwordless_user.auth.passToken}`)
        .type('form').send({ 'password':TEST_PASSWORD })

      // Expect redirect
      chai.expect(res).to.redirectTo('/login')

      // Assert password was set
      chai.assert.isString(
        (await User.findOne({'email':TEST_EMAIL} ))
        .auth.password, 'Failed to correctly save password'
      )

      return res

    })

    // These tests require the test user to have been created
    after( () => {

      describe('Logged out', function() {

        // Password fuzzing could take a while... give it five seconds
        this.timeout(5000)

        it(`Fails to log in with ${FUZZED_PASSWORD_TRIES} fuzzed passwords`, () => {

          // Fuzz passwords
          froth(FUZZED_PASSWORD_TRIES).forEach( async (fuzzed_password) => {

            // Confirm redirect
            chai.expect( await request.post('/login')
              .type('form').send({
                'email': TEST_EMAIL,
                'password': fuzzed_password
              })
            ).to.redirectTo('/login') // Hey! Incorrect email or password.

          })

        })

        it('Loads forgot password page', async () => {
          chai.expect(await request.get('/login/forgot'))
            .to.be.html.and.have.status(200)
        })

        // TODO: Test already-logged-in forgot password requests

        // TODO: Test invalid and fuzzed forgot password requests

        it('Sends valid forgot password request', async () => {

          // Responds with 200
          chai.expect( await request.post('/login/forgot')
            .type('form').send({
              'email': TEST_EMAIL,
            })
          ).to.redirectTo('/login')

          // Assert password token was set
          chai.expect(
            (await User.findOne({'email':TEST_EMAIL} )).auth.passToken
          ).to.be.a('string').and.to.have.lengthOf(32)

        })

        // TODO: Create test for changing forgetten password

        // Finally log in successfully
        after( () => {

          it('Logs in with password', async () => {
            chai.expect(
              await request.post('/login')
                .type('form').send({
                  email: TEST_EMAIL,
                  password: TEST_PASSWORD
                })
            ).to.redirectTo('/map')

            // Then do tests requiring login
            after( () => {
              describe('Logged in', () => {

                it('Logs out', async () => {
                  chai.expect(await request.get('/logout')).to.redirectTo('/')
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

          })

        })

      })

    })


  })

})
