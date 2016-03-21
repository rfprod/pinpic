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
	books: [{
		name: String,
		isbn13: String,
		googleVolumeId: String,
		thumbnail: String,
		timestamp: String
	}],
	offers: {
		toUser: [{
			userID: String,
			bookISBN: String,
			timestamp: String,
			completed: Boolean
		}],
		fromUser: [{
			userID: String,
			bookISBN: String,
			timestamp: String,
			completed: Boolean
		}]
	}
});

module.exports = mongoose.model('User', User);