'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
	_id: String,
	owner: String,
	displayName: String,
	question: String,
    options: Array,
    votes: Array,
    timestamp: String
});

module.exports = mongoose.model('Poll', Poll);
