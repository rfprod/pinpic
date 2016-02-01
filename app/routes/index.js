'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');

var Polls = require('../models/polls');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) return next();
		else res.redirect('/login');
	}
	var clickHandler = new ClickHandler();

	app.route('/').get(isLoggedIn, function (req, res) {res.sendFile(path + '/public/index.html');});
	app.route('/login').get(function (req, res) {res.sendFile(path + '/public/login.html');});
	app.route('/logout').get(function (req, res) {
		req.logout();
		res.redirect('/login');
	});
	app.route('/profile').get(isLoggedIn, function (req, res) {
		Polls.find({}, function(err, docs) {
		    if (err) throw err;
	        console.log('list docs: '+JSON.stringify(docs));
	        if (docs.length == 0) console.log('documents do not exist');
	        else console.log('documents exist');
		});
		res.sendFile(path + '/public/profile.html');
	});
	app.route(/pollpost/).post(isLoggedIn, function(req, res){
    	console.log('res: '+JSON.stringify(req.body));
    	res.send("you posted: "+JSON.stringify(req.body));
	}); 
	app.route('/api/:id').get(isLoggedIn, function (req, res) {res.json(req.user.github);});
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(passport.authenticate('github', {
		successRedirect: '/',
		failureRedirect: '/login'
	}));
	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
};
