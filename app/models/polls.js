'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
	poll: {
		id: String,
		owner: String,
		displayName: String,
		question: String,
        options: Array,
        votes: Array
	}
});

module.exports = mongoose.model('Poll', Poll);
