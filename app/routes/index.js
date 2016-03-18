'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');
var clickHandler = new ClickHandler();

var Users = require('../models/users');
var https = require('https');

module.exports = function (app, passport, jsdom, fs) {
	
	var jquerySource = fs.readFileSync(path + "/public/js/jquery.min.js", "utf-8");
	var serializeDocument = jsdom.serializeDocument;
	var htmlUIuniformDropdownOption = "<option value='one'>One</option>";

	function isLoggedIn(req, res, next){
		if (req.isAuthenticated()) return next();
		else res.redirect('/login');
	}
	function isLoggedInBool(req, res, next){
		if (req.isAuthenticated()) return true;
		else return false;
	}

	app.route('/').get(function (req, res) {
		var htmlNavAuthed = "<li class='nav-pills active'><a href='#app'><span class='glyphicon glyphicon-bookmark'></span> All Books</a></li><li class='nav-pills'><a href='/profile'><span class='glyphicon glyphicon-user'></span> My Books</a></li><li class='nav-pills'><a href='/logout'><span class='glyphicon glyphicon-remove'></span> Logout</a></li>";
		var htmlNavNotAuthed = "<li class='nav-pills active'><a href='/'><span class='glyphicon glyphicon-bookmark'></span> All Books</a></li><li class='nav-pills'><a href='/login'><span class='glyphicon glyphicon-user'></span> Login With Github</a></li>";
		var htmlSourceIndex = null;
		var bookTemplate = null;
		fs.readFile(path + "/app/models/book.html","utf-8", function(err,data){
			if (err) throw err;
			bookTemplate = data;
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
						
						var jsonTotalItems = 0, resBookGoogleId = [], resBookTitle = [], resBookDescription = [], resBookISBN13 = [], resBookThumbnail = [];
						
						// get data from google books API
						var data = '';
						var url = 'https://www.googleapis.com/books/v1/volumes?q=+intitle&startIndex=0&maxResults=40&key='+process.env.GOOGLE_API_SERVER_KEY;
						https.get(url, (response) => {
							response.setEncoding('utf-8');
							response.on('data', (chunk) => {
								data += chunk;
							});
							response.on('end', () => {
								console.log('no more data in response');
								var json = JSON.parse(data);
								var jsonItems = json.items;
								//console.log(jsonItems);
								jsonTotalItems = json.totalItems;
								console.log('jsonTotalItems: '+jsonTotalItems);
								for (var i=0;i<jsonItems.length-1;i++){
									if (typeof jsonItems[i].id != 'undefined' &&
										typeof jsonItems[i].volumeInfo.title != 'undefined' &&
										typeof jsonItems[i].volumeInfo.description != 'undefined' &&
										typeof jsonItems[i].volumeInfo.industryIdentifiers != 'undefined' &&
										typeof jsonItems[i].volumeInfo.imageLinks != 'undefined')
									{
										resBookGoogleId.push(jsonItems[i].id);
										resBookTitle.push(jsonItems[i].volumeInfo.title);
										resBookDescription.push(jsonItems[i].volumeInfo.description);
										resBookISBN13.push(jsonItems[i].volumeInfo.industryIdentifiers[0].identifier);
										resBookThumbnail.push(jsonItems[i].volumeInfo.imageLinks.thumbnail);
									}
								}
								console.log('resBookGoogleId: '+resBookGoogleId);
								console.log('resBookTitle: '+resBookTitle);
								console.log('resBookDescription: '+resBookDescription);
								console.log('resBookISBN13: '+resBookISBN13);
								console.log('resBookThumbnail: '+resBookThumbnail);
								
								for (var i=0;i<resBookGoogleId.length;i++){
									$('.books').append(bookTemplate);
									var mediaContainer = $('.media').last();
									mediaContainer.find('#book_thumbnail_link').attr('href',resBookThumbnail[i]);
									mediaContainer.find('#book_thumbnail_img').attr('src',resBookThumbnail[i]);
									mediaContainer.find('#book_name').html(resBookTitle[i]);
									mediaContainer.find('#book_isbn13').html(resBookISBN13[i]);
									mediaContainer.find('#book_googleBookId').html(resBookGoogleId[i]);
									mediaContainer.find('#book_description').html(resBookDescription[i]);
								}
								getBookOwnersFromDB();
							});
						}).on('error', (e) => {
							console.log('error: ${e.message}');
						});
						
						function getBookOwnersFromDB(){
							// get users data to see offerings
							var bookOwner = "";
							var newHtml = null;
							console.log('getting books data from DB');
							Users.find({}, function(err, docs) {
							    if (err) throw err;
						        if (docs.length == 0) {
						        	console.log('users do not exist, no offers exist');
						        	console.log("index page DOM manipulations complete");
									newHtml = serializeDocument(window.document);
									res.send(newHtml);
									window.close();
						        }
						        else {
						        	console.log('at least one user exists, checking if user has books to offer');
						        	for (var i=0;i<docs.length;i++){
						        		
						        		bookOwner = docs[i].github.id;
						        		console.log('book owner: '+bookOwner);
						        		var userBooks = docs[i].books;
						        		
										for (var z=0;z<userBooks.length;z++){
											console.log(userBooks[i]);
											/*$('.options-selector').last().append(htmlUIuniformDropdownOption);
											$('option').last().val(pollOptions[z]);
											$('option').last().html(pollOptions[z]);*/
										}
						        		
						        		/*pollId = "poll-"+docs[i]._id;
						        		pollName = docs[i].displayName;
						        		pollQuestion = docs[i].question;
										pollVotes = docs[i].votes;
										pollOptions = docs[i].options;
										pollLength = pollVotes.length;*/
										
										/*
										$('#book_owner').last().html(bookOwner);
										*/
						        	}
									console.log("index page DOM manipulations complete");
									newHtml = serializeDocument(window.document);
									res.send(newHtml);
									window.close();
						        }
							});
						}
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
		var bookOwnerIdFilter = req.session.passport.user;
		var htmlSourceProfile = null;
		var bookTemplate = null;
		fs.readFile(path + "/app/models/book-editable.html","utf-8", function(err,data){
			if (err) throw err;
			bookTemplate = data;
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
						Users.find({_id: bookOwnerIdFilter}, function(err, docs) {
						    if (err) throw err;
						    var newHtml = null;
						    //console.log(docs);
						    var userBooks = docs[0].books;
						    var userInOffers = docs[0].offers.toUser;
						    var userOutOffers = docs[0].offers.fromUser;
						    $('#profile-books').html(userBooks.length);
				        	$('#profile-in-offers').html(userInOffers.length);
				        	$('#profile-out-offers').html(userOutOffers.length);
					        if (userBooks.length == 0) {
					        	console.log('books do not exist');
					        	$('.books').append('You do not own any books yet.');
					        }else{
					        	console.log('at least one book exists');
					        	for (var i=0;i<userBooks.length;i++){
									$('.books').append(bookTemplate);
									var mediaContainer = $('.media').last();
									mediaContainer.attr('id',userBooks[i].isbn13);
									mediaContainer.find('#book_thumbnail_link').attr('href',userBooks[i].thumbnail);
									mediaContainer.find('#book_thumbnail_img').attr('src',userBooks[i].thumbnail);
									mediaContainer.find('#book_name').html(userBooks[i].name);
									mediaContainer.find('#book_isbn13').html(userBooks[i].isbn13);
									mediaContainer.find('#book_googleBookId').html(userBooks[i].googleVolumeId);
									mediaContainer.find('#book_timestamp').html(userBooks[i].timestamp);
									if (userInOffers.length == 0){
										mediaContainer.find('#accept-offer').addClass('disabled');
										mediaContainer.find('#reject-offer').addClass('disabled');
									}
									for (var i=0;i<userInOffers.length;i++){
							        	if (userInOffers[i].completed == 'false' && userInOffers[i].isbn13 == userBooks[i].isbn13){
							        		var offerUnitHTML = "<div class='checkbox'><label><input type='checkbox' value=''>User id"+userInOffers[i].userID+" is interested in buying this book for "+userInOffers[i].amountOffered+".</label></div>";
							        		mediaContainer.find('#offer-details').append(offerUnitHTML);
							        	}
							        }
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
	app.route(/addbook/).post(isLoggedIn, function(req, res){
		var bookOwner = req.session.passport.user;
		console.log(bookOwner);
    	var bookName = req.body.bookname;
    	console.log('bookName: '+bookName);
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
    	Users.find({_id: bookOwner}, function(err,data){
	    	if (err) throw err;
	        //console.log(data);
	        var userBooks = [];
	        for (var i=0;i<data[0].books.length;i++){
	        	userBooks.push(data[0].books[i]);
	        }
	        //console.log('userBooks : '+userBooks);
	        var jsonTotalItems = 0, resBookGoogleId = [], resBookTitle = [], resBookDescription = [], resBookISBN13 = [], resBookThumbnail = [];
	        // get data from google books API
			var apiData = '';
			var url = 'https://www.googleapis.com/books/v1/volumes?q=intitle:'+bookName+'&startIndex=0&maxResults=40&key='+process.env.GOOGLE_API_SERVER_KEY;
			https.get(url, (response) => {
				response.setEncoding('utf-8');
				response.on('data', (chunk) => {
					apiData += chunk;
				});
				response.on('end', () => {
					console.log('no more data in response');
					var json = JSON.parse(apiData);
					var jsonItems = json.items;
					//console.log(jsonItems);
					jsonTotalItems = json.totalItems;
					console.log('jsonTotalItems: '+jsonTotalItems);
					for (var i=0;i<jsonItems.length-1;i++){
						if (typeof jsonItems[i].id != 'undefined' &&
							typeof jsonItems[i].volumeInfo.title != 'undefined' &&
							typeof jsonItems[i].volumeInfo.description != 'undefined' &&
							typeof jsonItems[i].volumeInfo.industryIdentifiers != 'undefined' &&
							typeof jsonItems[i].volumeInfo.imageLinks != 'undefined')
						{
							resBookGoogleId.push(jsonItems[i].id);
							resBookTitle.push(jsonItems[i].volumeInfo.title);
							resBookDescription.push(jsonItems[i].volumeInfo.description);
							resBookISBN13.push(jsonItems[i].volumeInfo.industryIdentifiers[0].identifier);
							resBookThumbnail.push(jsonItems[i].volumeInfo.imageLinks.thumbnail);
						}
					}
					// add random book from parsed server response
					var randomBookId = Math.floor(Math.random()*((resBookGoogleId.length-1)-0+1) + 0);
					userBooks.push({
						name: resBookTitle[randomBookId],
						isbn13: resBookISBN13[randomBookId],
						googleVolumeId: resBookGoogleId[randomBookId],
						thumbnail: resBookThumbnail[randomBookId],
						timestamp: dateLog
					});
					console.log('userBooks updated');
					console.log(userBooks);
					Users.update({_id:bookOwner}, {$set:{books:userBooks}}, function(err,dt){
				    	if (err) throw err;
				        console.log('updated user: '+JSON.stringify(dt));
				        req.session.valid = true;
	  					res.redirect('/profile');
				    });
				});
			}).on('error', (e) => {
				console.log('error: ${e.message}');
			});
	    });
	});
	app.ws('/removebook', function(ws, res){
		console.log('/removebook');
		ws.on('message', function(msg){
			console.log('remove book: '+msg);
			var wssMsg = msg.split('|');
			console.log('wssMsg: '+JSON.stringify(wssMsg));
			Users.find({'github.id': wssMsg[0]}, function(err, docs) {
		    	if (err) throw err;
		    	var userBooks = docs[0].books;
		    	var updatedBooks = [];
		    	for (var i=0;i<userBooks.length;i++){
		    		if (userBooks[i].isbn13 != wssMsg[1]) updatedBooks.push(userBooks[i]);
		    	}
		    	Users.update({'github.id': wssMsg[0]}, {$set:{books:updatedBooks}}, function(err,dt){
			    	if (err) throw err;
			        console.log('updated user: '+JSON.stringify(dt));
			        ws.send('book removed, updated books for the owner: '+JSON.stringify(updatedBooks),function(error) {
				    	if (error) throw error;
					});
			    });
	        });
		});
		ws.on('close', function() {
	        console.log('Remove book: Client disconnected.');
	    });
	    ws.on('error', function() {
	        console.log('Remove book: ERROR');
	    });
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
