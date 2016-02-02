'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');

var Polls = require('../models/polls');

module.exports = function (app, passport, jsdom, fs) {
	
	var jquerySource = fs.readFileSync(path + "/public/js/jquery.min.js", "utf-8");
	var serializeDocument = jsdom.serializeDocument;
	var htmlUIuniformButton = "<button type='button' class='btn btn-info btn-sm'>Button 1</button>";
	var htmlUIuniformDropdownOption = "<option value='one'>One</option>";

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) return next();
		else res.redirect('/login');
	}
	var clickHandler = new ClickHandler();

	app.route('/').get(isLoggedIn, function (req, res) {
		var htmlSourceIndex = null;
		var pollTemplate = null;
		fs.readFile(path + "/app/models/poll.html","utf-8", function(err,data){
			if (err) throw err;
			pollTemplate = data;
			//console.log(pollTemplate);
			fs.readFile(path + "/public/index.html", "utf-8", function (err,data) {
				if (err) throw err;
			  	htmlSourceIndex = data;
			  	jsdom.env({
					html: htmlSourceIndex,
					src: [jquerySource],
					done: function (err, window) {
						if (err) throw err;
						var $ = window.$;
						console.log("index page DOM successfully retrieved");
						//console.log($('body').html());
						//$('.polls').html("IT'S ALIVE! ALIVE!!!!");
						var pollId = "";
						var pollName = "";
						var pollQuestion = "";
						var pollVotes = [];
						var pollOptions = [];
						var pollLength = pollVotes.length;
						console.log('getting polls data from DB');
						Polls.find({}, function(err, docs) {
						    if (err) throw err;
					        //console.log('list docs: '+JSON.stringify(docs));
					        if (docs.length == 0) console.log('polls do not exist');
					        else {
					        	console.log('at least one poll exists');
					        	var chartInitialization = "<script>$(document).ready(function(){";
					        	var chartInitializationENDING = "});</script>";
					        	for (var i=0;i<docs.length;i++){
					        		pollId = "poll-"+docs[i]._id;
					        		pollName = docs[i].displayName;
					        		pollQuestion = docs[i].question;
									pollVotes = docs[i].votes;
									pollOptions = docs[i].options;
									pollLength = pollVotes.length;
									$('.polls').append(pollTemplate);
									$('.poll-heading').last().html(pollName);
									$('.poll-heading').last().attr('href','#'+pollId);
									$('.poll-internals').last().attr('id',pollId);
									$('input[id="poll-id"]').last().attr('value',docs[i]._id);
									$('canvas').last().attr('id',docs[i]._id);
									$('.poll-question').last().html(pollQuestion);
									for (var z=0;z<pollVotes.length;z++){
										$('.options-selector').last().append(htmlUIuniformDropdownOption);
										$('option').last().val(pollOptions[z]);
										$('option').last().html(pollOptions[z]);
									}
									//var chartInitialization = "<script>$(document).ready(function(){$('#"+pollId+"').bind('shown.bs.collapse', function (e) {drawDoughbutChart(4, [1, 4, 6, 8], ['Option #1', 'Option #2', 'Option #3', 'Option #4']);$('html, body').animate({scrollTop: $(this).parent().offset().top-$('nav').height()});});});</script>";
									//var chartInitialization = "<script>$(document).ready(function(){$('#"+pollId+"').bind('shown.bs.collapse', function (e) {drawDoughbutChart("+pollLength+", "+JSON.stringify(pollVotes)+", "+JSON.stringify(pollOptions)+");$('html, body').animate({scrollTop: $(this).parent().offset().top-$('nav').height()});});});</script>";
									chartInitialization += "$('#"+pollId+"').bind('shown.bs.collapse', function (e) {drawDoughbutChart("+docs[i]._id+", "+pollLength+", "+JSON.stringify(pollVotes)+", "+JSON.stringify(pollOptions)+");$('html, body').animate({scrollTop: $(this).parent().offset().top-$('nav').height()});});";
									//console.log("chartInitialization: "+chartInitialization);
									
					        	}
					        	chartInitialization += chartInitializationENDING;
					        	$('body').append(chartInitialization);
								console.log("index page DOM manipulations complete");
								var newHtml = serializeDocument(window.document);
								res.send(newHtml);
								window.close();
					        }
						});
					}
				});
			});
		});
	});
	app.route('/login').get(function (req, res) {res.sendFile(path + '/public/login.html');});
	app.route('/logout').get(function (req, res) {
		req.logout();
		res.redirect('/login');
	});
	app.route('/profile').get(isLoggedIn, function (req, res) {
		Polls.find({}, function(err, docs) {
		    if (err) throw err;
	        console.log('list docs: '+JSON.stringify(docs));
	        if (docs.length == 0) console.log('polls do not exist');
	        else console.log('polls exist');
		});
		var htmlSourceProfile = null;
		fs.readFile(path + "/public/profile.html", "utf-8", function (err,data) {
			if (err) throw err;
		  	htmlSourceProfile = data;
		  	jsdom.env({
				html: htmlSourceProfile,
				src: [jquerySource],
				done: function (err, window) {
					if (err) throw err;
					var $ = window.$;
					console.log("profile page DOM successfully retrieved");
					//console.log($('body').html());
					$('.polls').html("IT'S ALIVE! ALIVE!!!!");
					console.log("profile page DOM manipulations complete");
					var newHtml = serializeDocument(window.document);
					res.send(newHtml);
					window.close();
				}
			});
			//res.sendFile(path + '/public/profile.html');
		});
	});
	app.route(/pollpost/).post(isLoggedIn, function(req, res){
    	//console.log('req: '+JSON.stringify(req.body));
    	var pollOwner = req.body.owner;
    	var pollName = req.body.name;
    	var pollQuestion = req.body.question;
    	var pollOptions = req.body.options.replace(/ , /g,',').replace(/ ,/g,',').replace(/, /g,',').split(',');
    	var pollVotes = [];
    	for (var i=0;i<pollOptions.length;i++) pollVotes.push(0);
		var dateLog = "";
			var date = new Date();
			var year = date.getFullYear();
			var month = date.getMonth()+1;
			if (month <10) month = "0"+month;
			var day = date.getDate();
			var hours = date.getHours();
			var minutes = date.getMinutes();
			if (minutes <10) minutes = "0"+minutes;
			dateLog = year+"-"+month+"-"+day+" "+hours+":"+minutes;
    	var id = null;
    	console.log('POST params: '+pollOwner+" | "+pollName+" | "+pollQuestion+" | "+JSON.stringify(pollOptions)+" | "+JSON.stringify(pollVotes)+" | "+dateLog);
    	Polls.find({}, function(err,data){
	    	if (err) throw err;
	        console.log('"polls" collection: '+JSON.stringify(data));
	        id = data.length + 1;
	        console.log('next id: '+id);
		    // prepare new record
		    var newPoll = new Polls();
			newPoll._id = id;
			newPoll.owner = pollOwner;
			newPoll.displayName = pollName;
			newPoll.question = pollQuestion;
			newPoll.options = pollOptions;
			newPoll.votes = pollVotes;
			newPoll.timestamp = dateLog;
			newPoll.save(function (err) {
				if (err) throw err;
				console.log('data saved');
			});
			console.log(newPoll);
	    });
    	//res.send("you posted: "+JSON.stringify(req.body));
    	req.session.valid = true;
  		res.redirect('/profile');
	});
	app.route(/votepost/).post(function(req, res){
		var returnToReferer = req.headers.referer;
		returnToReferer = returnToReferer.substr(returnToReferer.indexOf(".io")+3,returnToReferer.length);
		//console.log(returnToReferer);
    	//console.log('req: '+JSON.stringify(req.body));
    	var pollId = req.body.pollid;
    	var pollVote = req.body.vote;
    	Polls.find({_id: parseInt(pollId,10)}, function(err,data){
	    	if (err) throw err;
	    	var addVoteIndex = data[0].options.indexOf(pollVote);
	    	var updatedVotes = data[0].votes;
	    	updatedVotes[addVoteIndex]++;
	    	console.log('updatedVotes: '+JSON.stringify(updatedVotes));
	    	console.log("addVoteIndex: "+addVoteIndex);
	    	Polls.update({_id: parseInt(pollId,10)}, {$set: {votes: updatedVotes}},function(err,data){
	    		if(err) throw err;
	    		console.log(data);
	    	});
	        console.log('poll id '+pollId+': '+JSON.stringify(data));
	    });
    	//res.send("you posted: "+JSON.stringify(req.body));
    	req.session.valid = true;
  		res.redirect(returnToReferer);
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
