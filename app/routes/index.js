'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var clickHandler = new ClickHandler();

var Users = require('../models/users');
var https = require('https');

module.exports = function (app, passport, jsdom, fs, syncrec) {
	
	var jquerySource = fs.readFileSync(path + "/public/js/jquery.min.js", "utf-8");
	var serializeDocument = jsdom.serializeDocument;

	function isLoggedIn(req, res, next){
		if (req.isAuthenticated()) return next();
		else res.redirect('/login');
	}
	function isLoggedInBool(req, res, next){
		if (req.isAuthenticated()) return true;
		else return false;
	}

	app.route('/').get(function (req, res) {
		console.log('/');
		var htmlNavAuthed = "<li class='nav-pills active'><a href='#app'><span class='glyphicon glyphicon-pushpin'></span> All Pics</a></li><li class='nav-pills'><a href='/profile'><span class='glyphicon glyphicon-user'></span> My Pics</a></li><li class='nav-pills'><a href='/logout'><span class='glyphicon glyphicon-remove'></span> Logout</a></li>";
		var htmlNavNotAuthed = "<li class='nav-pills active'><a href='/'><span class='glyphicon glyphicon-pushpin'></span> All Pics</a></li><li class='nav-pills'><a href='/login'><span class='glyphicon glyphicon-user'></span> Sign up / Login</a></li>";
		var htmlSourceIndex = null;
		var gridItemTemplate = null;
		fs.readFile(path + "/app/models/grid-item.html","utf-8", function(err,data){
			if (err) throw err;
			gridItemTemplate = data;
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
						//$('.books').html("IT'S ALIVE! ALIVE!!!!");
						if (isLoggedInBool(req, res)) $('.navbar-right').html(htmlNavAuthed);
						else $('.navbar-right').html(htmlNavNotAuthed);
						var newHtml = null;
						Users.find({},function(err, docs){
							if (err) throw err;
						    console.log(docs);
						    for (var i in docs){
							    var userId = docs[i]._id;
							    var userLinks = docs[i].links;
							    var userName = null;
							    if (typeof docs[i].userExtended != 'undefined') if (typeof docs[i].userExtended.fullName != 'undefined') userName = docs[i].userExtended.fullName;
							    else userName = docs[i]._id;
							    if (typeof userLinks != 'undefined') $('#profile-links').html(userLinks.length);
							    else $('#profile-links').html('0');
						        if (typeof userLinks == 'undefined') {
						        	console.log('links do not exist for user: '+userId);
						        }else if (userLinks.length == 0) {
						        	console.log('links do not exist for user: '+userId);
						        }else{
						        	console.log('at least one link exists for user: '+userId);
						        	console.log('userLinks length: '+userLinks.length);
						        	for (var z in userLinks){
										$('.grid').append(gridItemTemplate);
										var gridItemContainer = $('.grid-item').last();
										gridItemContainer.attr('id',userLinks[z]._id);
										gridItemContainer.find('#url-img').attr('src',userLinks[z].url);
										gridItemContainer.find('#img-name').attr('src',userLinks[z].name);
										
										if (typeof userName != 'undefined') gridItemContainer.find('#owner-link').html(userName);
										else gridItemContainer.find('#owner-link').html(userId);
										gridItemContainer.find('#owner-link').attr('https://pinpincs-rfprod.c9users.io/publicprofile/'+userId);
										gridItemContainer.find('#remove-link').attr('id','remove-link-'+userLinks[z]._id);
									}
						        }
						    }
						    if ($('.grid').children().length == 0) $('.grid').html('No links have been added yet.');
					        console.log("index page DOM manipulations complete");
							newHtml = serializeDocument(window.document);
							res.send(newHtml);
							window.close();
						}).limit(10);
					}
				});
			});
		});
	});
	app.route('/login').get(function (req, res) {
		if (isLoggedInBool(req,res)) res.redirect('/profile');
		else res.sendFile(path + '/public/login.html');
	});
	app.route('/logout').get(function (req, res) {
		req.logout();
		res.redirect('/login');
	});
	app.route('/profile').get(isLoggedIn, function (req, res) {
		console.log('/profile');
		var authedUserId = req.session.passport.user;
		var htmlSourceProfile = null;
		var gridItemTemplate = null;
		fs.readFile(path + "/app/models/grid-item.html","utf-8", function(err,data){
			if (err) throw err;
			gridItemTemplate = data;
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
						//$('.polls').html("IT'S ALIVE! ALIVE!!!!");
						console.log('getting books data from DB');
						/* replace values
						var add = {"_id":"56f2736daee46f4e08b09353","completed":false,"timestamp":"2016-03-23 10:43","bookISBN":"9781449383077","userID":"56ec034c13c627811278b4d4"};
						var remove = {"_id":"56f183f1ac14245b18f8fd79","completed":false,"timestamp":"2016-03-22 17:42","bookISBN":"0596008570","userID":"56f1813c56a146f3176fef35"};
						Users.update({_id: authedUserId}, { $pull: {'offers.toUser':remove}}, function(err,dt){if (err) throw err;console.log('removing value: '+JSON.stringify(dt));});
						Users.update({_id: authedUserId}, { $push: {'offers.toUser':add}}, function(err,dt){if (err) throw err;console.log('adding value: '+JSON.stringify(dt));});
						*/
						/* init offers
						Users.update({_id: authedUserId}, { $set: {'offers.toUser':[]}}, function(err,dt){if (err) throw err;console.log('init in offers: '+JSON.stringify(dt));});
						Users.update({_id: authedUserId}, { $set: {'offers.fromUser':[]}}, function(err,dt){if (err) throw err;console.log('init out offers: '+JSON.stringify(dt));});
						*/
						Users.find({_id: authedUserId}, function(err, docs) {
						    if (err) throw err;
						    var newHtml = null;
						    console.log(docs);
						    var userPics = docs[0].pics;
						    console.log(userPics);
						    var userName = docs[0].userExtended.fullName;
						    if (typeof userPics != 'undefined') $('#profile-links').html(userPics.length);
						    else $('#profile-links').html('0');
				        	var userExtended = docs[0].userExtended;
				        	if (typeof userExtended.email != 'undefined' && userExtended.email != '') $('input[id="profile-email"]').attr('value', userExtended.email);
				        	if (typeof userExtended.fullName != 'undefined' && userExtended.fullName != '') $('input[id="profile-fullname"]').attr('value', userExtended.fullName);
				        	if (typeof userExtended.city != 'undefined' && userExtended.city != '') $('input[id="profile-city"]').attr('value', userExtended.city);
				        	if (typeof userExtended.state != 'undefined' && userExtended.state != '') $('input[id="profile-state"]').attr('value', userExtended.state);
					        if (typeof userPics == 'undefined') {
					        	console.log('links do not exist');
					        	$('.grid').html('You have not added any links to images yet.');
					        }else if (userPics.length == 0) {
					        	console.log('links do not exist');
					        	$('.grid').html('You have not added any links to images yet.');
					        }else{
					        	console.log('at least one link exists');
					        	console.log('userPics length: '+userPics.length);
					        	for (var z in userPics){
									$('.grid').append(gridItemTemplate);
									var gridItemContainer = $('.grid-item').last();
									gridItemContainer.attr('id','container-'+userPics[z]._id);
									gridItemContainer.find('#url-img').attr('src',userPics[z].url);
									gridItemContainer.find('#img-name').html(userPics[z].name);
									
									if (typeof userName != 'undefined') gridItemContainer.find('#owner-link').html(userName);
									else gridItemContainer.find('#owner-link').html(authedUserId);
									gridItemContainer.find('#owner-link').attr('href','https://pinpincs-rfprod.c9users.io/publicprofile/'+authedUserId);
									gridItemContainer.find('#remove-link').attr('id',userPics[z]._id);
								}
					        }
					        console.log("index page DOM manipulations complete");
							newHtml = serializeDocument(window.document);
							res.send(newHtml);
							window.close();
						});
					}
				});
			});
		});
	});
	app.ws('/pinpic', function(ws, res){
		console.log('/pinpic');
		var authedUserId = ws.upgradeReq.session.passport.user;
		ws.on('message', function(msg){
			console.log('add image url: '+msg);
			var urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
			if (urlPattern.test(msg)) {
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
				var linkName = msg;
				if (linkName.lastIndexOf('/') == linkName.length-1) linkName = linkName.substring(0,linkName.length-1);
				linkName = linkName.substring(linkName.lastIndexOf('/')+1,linkName.length);
				var newLink = {
					url: msg,
					name: linkName,
					timestamp: dateLog
				};
				console.log('new link obj');
				console.log(newLink);
				Users.update({_id:authedUserId}, {$push:{pics:newLink}}, function(err,dt){
			    	if (err) throw err;
			        console.log('updated user: '+JSON.stringify(dt));
					var gridItemTemplate = null;
					fs.readFile(path + "/app/models/grid-item.html","utf-8", function(err,data){
						if (err) throw err;
						gridItemTemplate = data;
						var newHtml = null;
						jsdom.env({
							html: '',
							src: [jquerySource],
							done: function (err, window) {
								if (err) throw err;
								var $ = window.$;
								console.log("profile page DOM successfully retrieved");
								//$('.polls').html("IT'S ALIVE! ALIVE!!!!");
								$('body').append(gridItemTemplate);
								var gridItem = $('body').find('.grid-item').last();
								gridItem.find('#url-img').attr('src',msg);
								gridItem.find('#img-name').html(linkName);
								gridItem.find('#owner-link').html(authedUserId);
								gridItem.find('#owner-link').attr('href',''+authedUserId);
								//gridItem.find('remove-link')
								console.log("index page DOM manipulations complete");
								newHtml = serializeDocument(window.document);
								ws.send(newHtml,function(error) {if (error) throw error;});
								window.close();
							}
						});
					});
			    });
			}else ws.send('Error: provide a valid url, please.',function(error) {if (error) throw error;});
		});
		ws.on('close', function() {console.log('Add book by isbn13: Client disconnected.');});
	    ws.on('error', function() {console.log('Add book by isbn13: ERROR');});
	});
	app.ws('/removepin', function(ws, res){
		console.log('/removepin');
		var authedUserId = ws.upgradeReq.session.passport.user;
		ws.on('message', function(msg){
			console.log('remove book: '+msg);
			Users.find({_id: authedUserId}, function(err, docs) {
		    	if (err) throw err;
		    	var userBooks = docs[0].books;
		    	var toUserOffers = docs[0].offers.toUser;
		    	var updatedBooks = [];
		    	var updatedToUserOffers = [];
		    	var otherUserProfileIDs = [];
		    	for (var i in userBooks){
		    		if (userBooks[i].isbn13 != msg) updatedBooks.push(userBooks[i]);
		    	}
		    	for (var i in toUserOffers){
		    		if (toUserOffers[i].bookISBN == msg) otherUserProfileIDs.push(toUserOffers[i].userID);
		    		else updatedToUserOffers.push(toUserOffers[i]);
		    	}
		    	console.log('otherUserProfileIDs: '+JSON.stringify(otherUserProfileIDs));
		    	Users.update({_id: authedUserId}, {$set:{books:updatedBooks, 'offers.toUser':updatedToUserOffers}}, function(err,dt){
			    	if (err) throw err;
			        console.log('updated user: '+JSON.stringify(dt));
			        // remove all offers toUser containing this book; also, remove fromUser offers in other users' profiles who requested the book
			        if (otherUserProfileIDs.length > 0){
				        var counter = 0;
				        (function removeFromUserOffer(){
				        	Users.find({_id: otherUserProfileIDs[counter]}, function(err, dcs) {
			    				if (err) throw err;
			    				var fromUserOffers = dcs[0].offers.fromUser;
			    				var updatedFromUserOffers = [];
			    				for (var fu in fromUserOffers){
			    					if (fromUserOffers[fu].bookISBN == msg && fromUserOffers[fu].userID == authedUserId) console.log('removing record');
			    					else updatedFromUserOffers.push(fromUserOffers[fu]);
			    				}
			    				console.log('updatedFromUserOffers: '+JSON.stringify(updatedFromUserOffers));
					        	Users.update({_id: otherUserProfileIDs[counter]}, {$set:{'offers.fromUser':updatedFromUserOffers}}, function(err,dt){
							    	if (err) throw err;
							        console.log('updated user: '+JSON.stringify(dt));
							        counter++;
							        if (counter < otherUserProfileIDs.length) removeFromUserOffer();
							        else ws.send('Success: book removed from current user and from requests in other user profiles.',function(error) {if (error) throw error;});
							    });
				        	});
				        })();
		    		}else ws.send('Success: book removed from current user and was not present in other user profiles.',function(error) {if (error) throw error;});
			    });
	        });
		});
		ws.on('close', function() {console.log('Remove book: Client disconnected.');});
	    ws.on('error', function() {console.log('Remove book: ERROR');});
	});
	
	app.ws(/emailsignup/, function(ws, res){
    	console.log('/emailsignup');
    	ws.on('message', function(msg){
			console.log('email sign up: '+msg);
			var wssMsg = msg.split('|');
			console.log('wssMsg: '+JSON.stringify(wssMsg));
			var response = '';
			Users.find({'userExtended.email':wssMsg[0]}, function(err,data){
		    	if (err) throw err;
		        if (data.length == 0) {
		        	response = 'success: account does not exist, creating account.';
		        	console.log(response);
		        	if (wssMsg[1] == wssMsg[2]){
		        		var newUser = new Users();
							newUser.userExtended.email = wssMsg[0];
							newUser.userExtended.pass = wssMsg[1];
							newUser.save(function (err) {
								if (err) throw err;
								console.log('data saved: new user created');
							});
							console.log(newUser);
						ws.send(response,function(error) {if (error) throw error;});
		        	}else{
		        		response = 'error: passwords do not match.';
			        	console.log(response);
			        	ws.send(response,function(error) {if (error) throw error;});
		        	}
		        }else{
		        	response = 'error: account associated with this email already exists';
		        	console.log(response);
		        	ws.send(response,function(error) {if (error) throw error;});
		        }
		    });
		});
		ws.on('close', function() {console.log('Email sign up: Client disconnected.');});
	    ws.on('error', function() {console.log('Email sign up: ERROR');});
	});
	app.route('/emaillogin/').post(passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
		var emailLogin = req.body.emailLogin;
		var passwordLogin = req.body.passwordLogin;
		console.log('emailLogin: '+emailLogin+" | passwordLogin: "+passwordLogin);
	    res.redirect('/profile');
	});
	app.ws('/edituser', function(ws, res){
		console.log('/edituser');
		var authedUserId = ws.upgradeReq.session.passport.user;
		ws.on('message', function(msg){
			console.log('edit user: '+msg);
			var wssMsg = msg.split('|');
			console.log('wssMsg: '+JSON.stringify(wssMsg));
			var updatedUserData = [];
			Users.find({_id: authedUserId}, function(err, docs) {
		    	if (err) throw err;
		    	var userExtended = docs[0].userExtended;
		    	console.log('current values: '+userExtended.email+' | '+userExtended.fullName+' | '+userExtended.city+' | '+userExtended.state);
		    	Users.update({_id: authedUserId}, {$set:{'userExtended.email':wssMsg[0], 'userExtended.fullName':wssMsg[1], 'userExtended.city':wssMsg[2], 'userExtended.state':wssMsg[3]}}, function(err,dt){
			    	if (err) throw err;
			        console.log('updated user: '+JSON.stringify(dt));
			        ws.send('user updated: '+JSON.stringify(dt),function(error) {
				    	if (error) throw error;
					});
			    });
			    
	        });
	        ws.send('user data edited: '+JSON.stringify(updatedUserData),function(error) {if (error) throw error;});
		});
		ws.on('close', function() {console.log('Edit user data: Client disconnected.');});
	    ws.on('error', function() {console.log('Edit user data: ERROR');});
	});
	
	app.route('/api/:id').get(isLoggedIn, function (req, res) {
		res.json(req.user.github);
	});
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(passport.authenticate('github', {
		successRedirect: '/profile',
		failureRedirect: '/login'
	}));
	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
};
