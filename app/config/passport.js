'use strict';

var GitHubStrategy = require('passport-github').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/users');
var configAuthGithub = require('./auth-github');
var configAuthTwitter = require('./auth-twitter');

module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});
	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});
	passport.use(new GitHubStrategy({
		clientID: configAuthGithub.githubAuth.clientID,
		clientSecret: configAuthGithub.githubAuth.clientSecret,
		callbackURL: configAuthGithub.githubAuth.callbackURL
	},function (token, refreshToken, profile, done) {
		process.nextTick(function () {
			User.findOne({ 'github.id': profile.id }, function (err, user) {
				if (err) return done(err);
				if (user) return done(null, user);
				else {
					var newUser = new User();
						newUser.github.id = profile.id;
						newUser.github.username = profile.username;
						newUser.github.displayName = profile.displayName;
						newUser.github.publicRepos = profile._json.public_repos;
						newUser.nbrClicks.clicks = 0;
						newUser.save(function (err) {
							if (err) throw err;
							return done(null, newUser);
						});
				}
			});
		});
	}));
	passport.use(new TwitterStrategy({
	    consumerKey: configAuthTwitter.twitterAuth.clientID,
	    consumerSecret: configAuthTwitter.twitterAuth.clientSecret,
	    callbackURL: configAuthTwitter.twitterAuth.callbackURL
	},function(token, tokenSecret, profile, done) {
		console.log('passport profile');
		console.log(profile);
	    process.nextTick(function () {
			User.findOne({ 'twitter.id': profile.id }, function (err, user) {
				if (err) return done(err);
				if (user) return done(null, user);
				else {
					var newUser = new User();
						newUser.twitter.id = profile.id;
						newUser.twitter.username = profile.username;
						newUser.twitter.displayName = profile.displayName;
						newUser.nbrClicks.clicks = 0;
						newUser.save(function (err) {
							if (err) throw err;
							return done(err, newUser);
						});
				}
			});
		});
	  }
	));
	passport.use(new LocalStrategy({
	    usernameField: 'emailLogin',
	    passwordField: 'passwordLogin',
	    passReqToCallback: true
	},function (req, username, password, done) {
		process.nextTick(function () {
			User.findOne({ 'userExtended.email': username }, function (err, user) {
				if (err) return done(err);
				if (!user) return done(null, false, {message: 'Unknown user'});
				if (user.userExtended.pass != password) return done(null, false, {message: 'Wrong password'});
				return done(null, user);
			});
		});
	}));
};