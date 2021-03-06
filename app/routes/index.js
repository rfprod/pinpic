'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var clickHandler = new ClickHandler();

var Users = require('../models/users');

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
							    var userPics = docs[i].pics;
							    if (typeof userPics != 'undefined') $('#profile-links').html(userPics.length);
							    else $('#profile-links').html('0');
						        if (typeof userPics == 'undefined') {
						        	console.log('links do not exist for user: '+userId);
						        }else if (userPics.length == 0) {
						        	console.log('links do not exist for user: '+userId);
						        }else{
						        	console.log('at least one link exists for user: '+userId);
						        	console.log('userPics length: '+userPics.length);
						        	for (var z in userPics){
										$('.grid').append(gridItemTemplate);
										var gridItemContainer = $('.grid-item').last();
										gridItemContainer.attr('id',userPics[z]._id);
										gridItemContainer.find('#url-img').attr('src',userPics[z].url);
										gridItemContainer.find('#url-img').addClass(userPics[z]._id.toString());
										gridItemContainer.find('#img-name').html(userPics[z].name);
										gridItemContainer.find('#owner-link').html(userId.toString());
										gridItemContainer.find('#owner-link').attr('href','https://pinpincs-rfprod.c9users.io/publicprofile-'+userId);
										gridItemContainer.find('#remove-link').remove();
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
		Users.find({},function(err, docs) {
		    if (err) throw err;
		    console.log(docs);
		});
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
						Users.find({_id: authedUserId}, function(err, docs) {
						    if (err) throw err;
						    var newHtml = null;
						    console.log(docs);
						    var userPics = docs[0].pics;
						    console.log(userPics);
						    if (typeof userPics != 'undefined') $('#profile-links').html(userPics.length);
						    else $('#profile-links').html('0');
						    if (typeof docs[0].github.id != 'undefined') $('#twtr-logo').remove();
						    else if (typeof docs[0].twitter.id != 'undefined') {
						    	$('#gh-logo').remove();
						    	$('#profile-repos').parent().remove();
						    }else{
						    	$('#gh-logo').remove();
						    	$('#twtr-logo').remove();
						    	$('#profile-id').parent().remove();
						    	$('#profile-username').parent().remove();
						    	$('#profile-name').parent().remove();
						    	$('#display-name').parent().remove();
						    	$('#profile-repos').parent().remove();
						    }
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
									gridItemContainer.find('#url-img').addClass(userPics[z]._id.toString());
									gridItemContainer.find('#img-name').html(userPics[z].name);
									gridItemContainer.find('#owner-link').html(authedUserId);
									gridItemContainer.find('#owner-link').attr('href','https://pinpincs-rfprod.c9users.io/publicprofile-'+authedUserId);
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
								gridItem.find('#owner-link').attr('href','https://pinpincs-rfprod.c9users.io/publicprofile-'+authedUserId);
								var picId = null;
								Users.find({_id:authedUserId}, function(err, docs) {
									if (err) throw err;
								    for (var y in docs[0].pics){
								    	if (docs[0].pics[y].url == msg && docs[0].pics[y].timestamp == dateLog) picId = docs[0].pics[y]._id;
								    }
								    gridItem.find('#remove-link').attr('id',picId);
									//gridItem.find('remove-link')
									console.log("index page DOM manipulations complete");
									newHtml = serializeDocument(window.document);
									ws.send(newHtml,function(error) {if (error) throw error;});
									window.close();
								});
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
			console.log('remove pinned image by id : '+msg);
	    	Users.update({_id: authedUserId}, {$pull:{pics:{_id:msg}}}, function(err,dt){
		    	if (err) throw err;
		        console.log('updated user pics: '+JSON.stringify(dt));
		        ws.send('Success: image link was removed from current user collection.',function(error) {if (error) throw error;});
		    });
		});
		ws.on('close', function() {console.log('Remove book: Client disconnected.');});
	    ws.on('error', function() {console.log('Remove book: ERROR');});
	});
	
	app.ws('/emailsignup/', function(ws, res){
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
	app.ws('/edituser/', function(ws, res){
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
	
	app.route(new RegExp(/\/publicprofile-[a-z0-9]{24}/)).get(function (req, res) {
		console.log(req.url);
		var userId = req.url.split('-')[1];
		console.log('userId: '+userId);
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
						console.log("profile page DOM successfully retrieved");
						//$('.polls').html("IT'S ALIVE! ALIVE!!!!");
						if (!isLoggedInBool(req,res)){
							$('#my-pics-nav').remove();
							$('#logout-nav').remove();
							$('.navbar-nav').append("<li class='nav-pills'><a href='/login'><span class='glyphicon glyphicon-user'></span> Sign up / Login</a></li>");
						}
						console.log('getting books data from DB');
						Users.find({_id: userId}, function(err, docs) {
						    if (err) throw err;
						    var newHtml = null;
						    console.log(docs);
						    var userPics = docs[0].pics;
						    console.log(userPics);
						    if (typeof userPics != 'undefined') $('#profile-links').html(userPics.length);
						    else $('#profile-links').html('0');
						    $('li.active').removeClass('active');
						    $('.alert-dismissible').remove();
						    $('#username').html('User <code>id '+userId+'</code> Public Profile');
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
									gridItemContainer.find('#url-img').addClass(userPics[z]._id.toString());
									gridItemContainer.find('#img-name').html(userPics[z].name);
									gridItemContainer.find('#owner-link').html(userId);
									gridItemContainer.find('#owner-link').attr('href','https://pinpincs-rfprod.c9users.io/publicprofile-'+userId);
									gridItemContainer.find('#remove-link').remove();
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
	
	app.route('/api/:id').get(isLoggedIn, function (req, res) {
		if (typeof req.user.github.id != 'undefined') res.json(req.user.github);
		else if (typeof req.user.twitter.id != 'undefined') res.json(req.user.twitter);
	});
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(passport.authenticate('github', {
		successRedirect: '/profile',
		failureRedirect: '/login'
	}));
	app.route('/auth/twitter').get(passport.authenticate('twitter'));
	app.route('/auth/twitter/callback').get(passport.authenticate('twitter', {
		successRedirect: '/profile',
		failureRedirect: '/login'
	}));
	app.route('/api/:id/clicks')
		.get(isLoggedIn, clickHandler.getClicks)
		.post(isLoggedIn, clickHandler.addClick)
		.delete(isLoggedIn, clickHandler.resetClicks);
};
