const router = require('express').Router()
const mw = require('../middleware.js')
const debug = require('debug')('tracman-routes-admin')
const User = require('../models.js').user

router.get('/', mw.ensureAdmin, (req,res) => {
	
	debug('Finding all users to populate admin page')
	User.find({}).sort({lastLogin:-1})
	.then( (found) => {
		debug(`Found ${found.length} users`)
		res.render('admin', {
			active: 'admin',
			noFooter: '1',
			users: found,
			total: found.length
		});
	})
	.catch( (err) => {
		debug('Error searching for all users for admin page')
		mw.throwErr(err,req)
	})
		
});
	
router.get('/delete/:usrid', mw.ensureAdmin,  (req, res, next) => {
	debug(`/admin/delete/${req.params.usrid} called`)
	
	User.findOneAndRemove({'_id':req.params.usrid})
	.then( (user)=>{
		debug(`Found user with id ${req.params.usrid}`)
		req.flash('success', `<i>${req.params.usrid}</i> deleted.`)
		res.redirect('/admin')
	})
	.catch( (err) => {
		debug(`Error searching for user to delete with id of ${req.params.usrid}`)
		mw.throwErr(err, req)
		res.redirect('/admin')
	})
	
})

module.exports = router
