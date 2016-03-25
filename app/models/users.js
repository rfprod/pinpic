'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	github: {
		id: String,
		displayName: String,
		username: String,
        publicRepos: Number
	},
	twitter: {
		id: String,
		displayName: String,
		username: String
	},
	userExtended: {
		email: String,
		pass: String,
		fullName: String,
		city: String,
		state: String
	},
	nbrClicks: {
	    clicks: Number 
	},
	pics: [{
		url: String,
		name: String,
		timestamp: String
	}]
});

module.exports = mongoose.model('User', User);