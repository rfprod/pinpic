'use strict';
var Users = require('../models/users.js');
//var Polls = require('../models/polls.js');
function ClickHandler () {
	this.getClicks = function (req, res) {
		/*
		Polls.aggregate([
	 		{$match: { owner: req.session.passport.user}},
	 		{$project: {
            	item: 1,
            	displayName: "$displayName",
            	numberOfOptions: { $size: "$options" }
	        }}
		]).exec(function(err,data){
		 	if(err) throw err;
		 	//console.log(JSON.stringify(data));
		 	res.json(data);
		});
		*/
		var data = [];
		res.json(data);
	};
	this.addClick = function (req, res) {
		/*
		Polls.aggregate([
	 		{$match: { owner: req.session.passport.user}},
	 		{$project: {
            	item: 1,
            	displayName: "$displayName",
            	numberOfOptions: { $size: "$options" }
	        }}
		]).exec(function(err,data){
		 	if(err) throw err;
		 	//console.log(JSON.stringify(data));
		 	res.json(data);
		});
		*/
		var data = [];
		res.json(data);
	};
	this.resetClicks = function (req, res) {
		/*
		Polls.find({owner: req.session.passport.user}, function(err,data){
		 	if(err) throw err;
		 	var filtered = [];
		 	data.forEach(function(entry){
		 		console.log(entry);
		 		if (entry.votes.reduce(function(a,b){return a+b;}) == 0) filtered.push(entry);
			});
			//console.log(JSON.stringify(filtered));
		 	res.json(filtered);
		});
		*/
		var data = [];
		res.json(data);
	};
}
module.exports = ClickHandler;