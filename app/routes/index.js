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
		var htmlNavAuthed = "<li class='nav-pills active'><a href='#app'><span class='glyphicon glyphicon-bookmark'></span> All Books</a></li><li class='nav-pills'><a href='/profile'><span class='glyphicon glyphicon-user'></span> My Books</a></li><li class='nav-pills'><a href='/logout'><span class='glyphicon glyphicon-remove'></span> Logout</a></li>";
		var htmlNavNotAuthed = "<li class='nav-pills active'><a href='/'><span class='glyphicon glyphicon-bookmark'></span> All Books</a></li><li class='nav-pills'><a href='/login'><span class='glyphicon glyphicon-user'></span> Sign up / Login</a></li>";
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
						var url = 'https://www.googleapis.com/books/v1/volumes?q=intitle:&startIndex=0&maxResults=40&key='+process.env.GOOGLE_API_SERVER_KEY;
						https.get(url, (response) => {
							response.setEncoding('utf-8');
							response.on('data', (chunk) => {data += chunk;});
							response.on('end', () => {
								console.log('no more data in response');
								var json = JSON.parse(data);
								var jsonItems = json.items;
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
								/*console.log('resBookGoogleId: '+resBookGoogleId);
								console.log('resBookTitle: '+resBookTitle);
								console.log('resBookDescription: '+resBookDescription);
								console.log('resBookISBN13: '+resBookISBN13);
								console.log('resBookThumbnail: '+resBookThumbnail);*/
								for (var i=0;i<resBookGoogleId.length;i++){
									$('.books').append(bookTemplate);
									var mediaContainer = $('.media').last();
									//mediaContainer.attr('id',resBookISBN13[i]);
									mediaContainer.find('#book_thumbnail_link').attr('href',resBookThumbnail[i]);
									mediaContainer.find('#book_thumbnail_img').attr('src',resBookThumbnail[i]);
									mediaContainer.find('#book_name').html(resBookTitle[i]);
									mediaContainer.find('#book_isbn13').html(resBookISBN13[i]);
									mediaContainer.find('#book_googleBookId').html(resBookGoogleId[i]);
									mediaContainer.find('#book_description').html(resBookDescription[i]);
									mediaContainer.find('#req-book').attr('id',resBookISBN13[i]);
									if (isLoggedInBool(req,res)) mediaContainer.find('.btn-req-book').find('div').before('<div class="btn-group" role="group"><button id="'+resBookISBN13[i]+'" class="btn btn-default btn-success btn-add-book" onclick="addBookByVolumeId(this);"><span class="glyphicon glyphicon-plus"></span> Add the book</button></div>');
								}
								getBookOwnersFromDB();
							});
						}).on('error', (e) => {
							console.log('error: ${e.message}');
						});
						
						function getBookOwnersFromDB(){
							var bookOwner = '';
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
						        }else{
						        	console.log('at least one user exists, checking if user has books to offer');
						        	var booksDOMobjChildren = $('.books').children();
						        	console.log(booksDOMobjChildren);
						        	console.log(docs);
						        	for (var i=0;i<docs.length;i++){
						        		bookOwner = docs[i]._id.toString();
						        		var userBooks = docs[i].books;
										for (var z=0;z<userBooks.length;z++){
											var bookISBN13index = resBookISBN13.indexOf(userBooks[z].isbn13);
											if (bookISBN13index != -1) {
												var selectBook = booksDOMobjChildren.eq(bookISBN13index);
												var bookOwnerDOM = selectBook.find('#book_owner');
												var currentValue = parseInt(bookOwnerDOM.html(),10);
												currentValue++;
												bookOwnerDOM.html(currentValue);
												var reqBookDOM = selectBook.find('.btn-request-book');
												var addBookDOM = selectBook.find('.btn-add-book');
												if (isLoggedInBool(req,res) && bookOwner == req.session.passport.user){
													addBookDOM.addClass('disabled');
													reqBookDOM.html('You own the book');
													reqBookDOM.removeClass('btn-info').addClass('btn-success');
													reqBookDOM.addClass('disabled');
												}else reqBookDOM.removeClass('disabled');
											}
										}
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
						    console.log(docs);
						    var userBooks = docs[0].books;
						    var userInOffers = docs[0].offers.toUser;
						    var userOutOffers = docs[0].offers.fromUser;
						    $('#profile-books').html(userBooks.length);
				        	$('#profile-in-offers').html(userInOffers.length);
				        	$('#profile-out-offers').html(userOutOffers.length);
				        	var userExtended = docs[0].userExtended;
				        	if (typeof userExtended.email != 'undefined' && userExtended.email != '') $('input[id="profile-email"]').attr('value', userExtended.email);
				        	if (typeof userExtended.fullName != 'undefined' && userExtended.fullName != '') $('input[id="profile-fullname"]').attr('value', userExtended.fullName);
				        	if (typeof userExtended.city != 'undefined' && userExtended.city != '') $('input[id="profile-city"]').attr('value', userExtended.city);
				        	if (typeof userExtended.state != 'undefined' && userExtended.state != '') $('input[id="profile-state"]').attr('value', userExtended.state);
					        if (userBooks.length == 0) {
					        	console.log('books do not exist');
					        	$('.books').append('You do not own any books yet.');
					        }else{
					        	console.log('at least one book exists');
					        	//console.log(JSON.stringify(userBooks));
					        	console.log('userBooks length: '+userBooks.length);
					        	for (var z=0;z<userBooks.length;z++){
									$('.books').append(bookTemplate);
									var mediaContainer = $('.media').last();
									mediaContainer.attr('id',userBooks[z].isbn13);
									mediaContainer.find('#book_thumbnail_link').attr('href',userBooks[z].thumbnail);
									mediaContainer.find('#book_thumbnail_img').attr('src',userBooks[z].thumbnail);
									mediaContainer.find('#book_name').html(userBooks[z].name);
									mediaContainer.find('#book_isbn13').html(userBooks[z].isbn13);
									mediaContainer.find('#book_googleBookId').html(userBooks[z].googleVolumeId);
									mediaContainer.find('#book_timestamp').html(userBooks[z].timestamp);
									mediaContainer.find('#remove-book').attr('id','remove-book-'+userBooks[z].isbn13);
									if (userInOffers.length == 0){
										mediaContainer.find('#accept-offer').addClass('disabled');
										mediaContainer.find('#reject-offer').addClass('disabled');
									}else{
										for (var i in userInOffers){
								        	if (userInOffers[i].completed == false && userInOffers[i].bookISBN == userBooks[z].isbn13){
								        		console.log(userInOffers[i].bookISBN+' ~ '+userBooks[z].isbn13);
								        		console.log(userInOffers[i].completed);
								        		console.log('writing offer');
								        		var inOfferUnitHTML = "<div class='checkbox'><label><input type='checkbox' value=''>User id"+userInOffers[i].userID+" is interested in buying this book.</label></div>";
								        		mediaContainer.find('#offer-details').append(inOfferUnitHTML);
								        	}else{
								        		mediaContainer.find('#accept-offer').addClass('disabled');
												mediaContainer.find('#reject-offer').addClass('disabled');
								        	}
								        }
									}
								}
								/*
								* output offer from authed user to other users
								*/
								var offersTemplate = null;
								fs.readFile(path + "/app/models/book-request.html","utf-8", function(err,dataOffers){
									if (err) throw err;
									offersTemplate = dataOffers;
									var userOffersContainer = $('div.panel-body');
									var isbn13Arr = [];
									if (userOutOffers.length > 0){
										for (var i in userOutOffers){
								        	if (userOutOffers[i].completed == false){
								        		console.log(userOutOffers[i]);
								        		console.log('writing offer');
								        		isbn13Arr.push(userOutOffers[i].bookISBN);
								        		userOffersContainer.append(offersTemplate);
								        		
								        		var offersMediaContainer = userOffersContainer.find('.media').last();
												offersMediaContainer.find('#book_owner').html(userOutOffers[i].userID);
												offersMediaContainer.find('#book_isbn13').html(userOutOffers[i].bookISBN);
												offersMediaContainer.find('#book_timestamp').html(userOutOffers[i].timestamp);
												offersMediaContainer.find('#cancel-req').attr('id',userOutOffers[i].bookISBN);
												
												var urlBookDetails = 'https://www.googleapis.com/books/v1/volumes?q=isbn:'+userOutOffers[i].bookISBN+'&key='+process.env.GOOGLE_API_SERVER_KEY;
												var syncRecRes = syncrec('GET', urlBookDetails);
												var syncRecResBody = JSON.parse(syncRecRes.getBody());
												var syncRecResBodyItems = syncRecResBody.items[0];
												console.log('requested book details: '+syncRecResBody);
												console.log('syncRecResBodyItems: '+syncRecResBodyItems);
												
												if (typeof syncRecResBodyItems.id != 'undefined' &&
													typeof syncRecResBodyItems.volumeInfo.title != 'undefined' &&
													typeof syncRecResBodyItems.volumeInfo.description != 'undefined' &&
													typeof syncRecResBodyItems.volumeInfo.industryIdentifiers != 'undefined' &&
													typeof syncRecResBodyItems.volumeInfo.imageLinks != 'undefined')
												{
													offersMediaContainer.find('#book_thumbnail_link').attr('href',syncRecResBodyItems.volumeInfo.imageLinks.thumbnail);
													offersMediaContainer.find('#book_thumbnail_img').attr('src',syncRecResBodyItems.volumeInfo.imageLinks.thumbnail);
													offersMediaContainer.find('#book_name').html(syncRecResBodyItems.volumeInfo.title);
													offersMediaContainer.find('#book_description').html(syncRecResBodyItems.volumeInfo.description);
												}
								        	}
								        }
									}else userOffersContainer.html('You have not requested any books yet.');
									console.log("index page DOM manipulations complete");
									newHtml = serializeDocument(window.document);
									res.send(newHtml);
									window.close();
								});
					        }
						});
					}
				});
			});
		});
	});
	app.ws('/cancelrequest', function(ws, res){
		console.log('/cancelrequest');
		var authedUserId = ws.upgradeReq.session.passport.user;
		ws.on('message', function(msg){
			console.log('cancel book request, isbn: '+msg);
			Users.find({_id: authedUserId}, function(err, docs) {
		    	if (err) throw err;
		    	var fromUserOffers = docs[0].offers.fromUser;
		    	var updatedFromUserOffers = [];
		    	var removeOffer = null;
		    	var bookOwnerID = null;
		    	console.log('fromUserOffers: '+JSON.stringify(fromUserOffers));
		    	for (var i=0;i<fromUserOffers.length;i++){
		    		if (fromUserOffers[i].bookISBN != msg) updatedFromUserOffers.push(fromUserOffers[i]);
		    		else {
		    			removeOffer = fromUserOffers[i];
		    			bookOwnerID = removeOffer.userID;
		    		}
		    	}
		    	console.log('updatedFromUserOffers: '+JSON.stringify(updatedFromUserOffers));
		    	console.log('remove offer: '+JSON.stringify(removeOffer));
		    	Users.update({_id: authedUserId}, {$set:{'offers.fromUser':updatedFromUserOffers}}, function(err,dt){
			    	if (err) throw err;
			        console.log('updated user: '+JSON.stringify(dt));
			    	Users.find({_id: bookOwnerID}, function(err, docs) {
				    	if (err) throw err;
				    	var toUserOffers = docs[0].offers.toUser;
				    	var updatedToUserOffers = [];
				    	console.log('toUserOffers: '+JSON.stringify(toUserOffers));
				    	for (var i=0;i<toUserOffers.length;i++){
				    		if (toUserOffers[i].bookISBN == msg && toUserOffers[i].userID == authedUserId) console.log('removing record');
				    		else updatedToUserOffers.push(toUserOffers[i]);
				    	}
				    	console.log('updatedToUserOffers: '+JSON.stringify(updatedToUserOffers));
				    	Users.update({_id: bookOwnerID}, {$set:{'offers.toUser':updatedToUserOffers}}, function(err,dt){
					    	if (err) throw err;
					        console.log('updated user: '+JSON.stringify(dt));
					        ws.send('Success: book request cancelled',function(error) {
						    	if (error) throw error;
							});
					    });
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
		ws.on('close', function() {
	        console.log('Email sign up: Client disconnected.');
	    });
	    ws.on('error', function() {
	        console.log('Email sign up: ERROR');
	    });
	});
	app.route('/emaillogin/').post(passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
		var emailLogin = req.body.emailLogin;
		var passwordLogin = req.body.passwordLogin;
		console.log('emailLogin: '+emailLogin+" | passwordLogin: "+passwordLogin);
	    res.redirect('/profile');
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
	        var userBooks = [];
	        for (var i=0;i<data[0].books.length;i++){
	        	userBooks.push(data[0].books[i]);
	        }
	        var jsonTotalItems = 0, resBookGoogleId = [], resBookTitle = [], resBookISBN13 = [], resBookThumbnail = [];
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
					if (jsonTotalItems > 0){
						for (var i=0;i<jsonItems.length;i++){
							if (typeof jsonItems[i].id != 'undefined' &&
								typeof jsonItems[i].volumeInfo.title != 'undefined' &&
								typeof jsonItems[i].volumeInfo.industryIdentifiers != 'undefined' &&
								typeof jsonItems[i].volumeInfo.imageLinks != 'undefined')
							{
								resBookGoogleId.push(jsonItems[i].id);
								resBookTitle.push(jsonItems[i].volumeInfo.title);
								resBookISBN13.push(jsonItems[i].volumeInfo.industryIdentifiers[0].identifier);
								resBookThumbnail.push(jsonItems[i].volumeInfo.imageLinks.thumbnail);
							}
						}
						// add random book from parsed server response
						var randomBookId = Math.floor(Math.random()*((resBookGoogleId.length-1)-0+1) + 0);
						console.log('randomBookId: '+randomBookId);
						var bookAlreadyExists = false;
						for (var z=0;z<userBooks.length;z++){
							console.log(userBooks[z].isbn13+' | '+resBookISBN13[randomBookId]);
				        	if (userBooks[z].isbn13 == resBookISBN13[randomBookId]) {
				        		bookAlreadyExists = true;
				        		break;
				        	}
				        }
						console.log('bookAlreadyExists: '+bookAlreadyExists);
						if (bookAlreadyExists == true){
							req.session.valid = true;
		  					res.redirect('/profile#already-exists');
						}else{
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
						}
					}
				});
			}).on('error', (e) => {
				console.log('error: ${e.message}');
			});
	    });
	});
	app.ws('/addbookbyisbn', function(ws, res){
		console.log('/addbookbyisbn');
		var authedUserId = ws.upgradeReq.session.passport.user;
		ws.on('message', function(msg){
			console.log('add book by isbn: '+msg);
			Users.find({_id: authedUserId}, function(err, docs) {
		    	if (err) throw err;
		    	var userBooks = docs[0].books;
		    	var apiData = '';
				var url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:'+msg+'&key='+process.env.GOOGLE_API_SERVER_KEY;
				https.get(url, (response) => {
					response.setEncoding('utf-8');
					response.on('data', (chunk) => {
						apiData += chunk;
					});
					response.on('end', () => {
						console.log('no more data in response');
						var json = JSON.parse(apiData);
						console.log(json);
						if (json.totalItems > 0){
							var jsonItem = json.items[0];
							if (typeof jsonItem.id != 'undefined' &&
								typeof jsonItem.volumeInfo.title != 'undefined' &&
								typeof jsonItem.volumeInfo.industryIdentifiers != 'undefined' &&
								typeof jsonItem.volumeInfo.imageLinks != 'undefined')
							{
								var bookAlreadyExists = false;
								for (var z=0;z<userBooks.length;z++){
									console.log(userBooks[z].isbn13+' | '+jsonItem.volumeInfo.industryIdentifiers[0].identifier);
						        	if (userBooks[z].isbn13 == jsonItem.volumeInfo.industryIdentifiers[0].identifier) {
						        		bookAlreadyExists = true;
						        		break;
						        	}
						        }
						        console.log('bookAlreadyExists: '+bookAlreadyExists);
						        if (bookAlreadyExists == true) ws.send('the book you are trying to add already exists',function(err){if (err) throw err;});
								else{
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
									userBooks.push({
										name: jsonItem.volumeInfo.title,
										isbn13: jsonItem.volumeInfo.industryIdentifiers[0].identifier,
										googleVolumeId: jsonItem.id,
										thumbnail: jsonItem.volumeInfo.imageLinks.thumbnail,
										timestamp: dateLog
									});
									console.log('userBooks updated');
									console.log(userBooks);
									Users.update({_id:authedUserId}, {$set:{books:userBooks}}, function(err,dt){
								    	if (err) throw err;
								        console.log('updated user: '+JSON.stringify(dt));
					  					ws.send('Success: book added to your collection.',function(error) {
									    	if (error) throw error;
										});
								    });
								}
							}
						}else ws.send('Google Books API response: not found',function(error) {if (error) throw error;});
					});
				}).on('error', (e) => {
					console.log('error: ${e.message}');
				});
	        });
		});
		ws.on('close', function() {
	        console.log('Add book by isbn13: Client disconnected.');
	    });
	    ws.on('error', function() {
	        console.log('Add book by isbn13: ERROR');
	    });
	});
	app.ws('/requestbook', function(ws, res){
		console.log('/requestbook');
		ws.on('message', function(msg){
			console.log('request book: '+msg);
	        if (typeof ws.upgradeReq.session.passport != 'undefined'){
				var authedUserId = ws.upgradeReq.session.passport.user;
				console.log('authedUserId: '+authedUserId);
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
				Users.find({_id: authedUserId}, function(err, docs) {
			    	if (err) throw err;
			    	var fromUserOffers = docs[0].offers.fromUser;
			    	var alreadyExists = false;
			    	for (var z in fromUserOffers){
			    		if (fromUserOffers[z].bookISBN == msg) alreadyExists = true;
			    	}
			    	var bookOwner = '';
			    	Users.find({}, function(err, dcs) {
				    	if (err) throw err;
				    	loop1:
				    	for (var d=0;d<dcs.length;d++){
				    		var userBooks = dcs[d].books;
				    		loop2:
				    		for (var b=0;b<userBooks.length;b++){
				    			if (userBooks[b].isbn13 == msg) {
				    				bookOwner = dcs[d]._id;
				    				console.log(bookOwner);
				    				break loop1;
				    			}
				    		}
				    	}
				    	if (!alreadyExists){
					    	fromUserOffers.push({
					    		userID: bookOwner,
								bookISBN: msg,
								timestamp: dateLog,
								completed: false
					    	});
				    	}
				    	/* update fromUser offers for the authed user */
				    	Users.update({_id: authedUserId}, {$set:{'offers.fromUser':fromUserOffers}}, function(err,dt){
					    	if (err) throw err;
					        console.log('updated user: '+JSON.stringify(dt));
					        Users.find({_id: bookOwner}, function(err, docOwner) {
						    	if (err) throw err;
						    	var toUserOffers = docOwner[0].offers.toUser;
						    	toUserOffers.push({
						    		userID: authedUserId,
									bookISBN: msg,
									timestamp: dateLog,
									completed: false
						    	});
						    	Users.update({_id: bookOwner}, {$set:{'offers.toUser':toUserOffers}}, function(err,dtOwn){
							    	if (err) throw err;
							        console.log('updated user: '+JSON.stringify(dtOwn));
							        if (alreadyExists) ws.send('Error: book is already requested by you.',function(error) {if (error) throw error;});
							        else ws.send('Success: book requested, book owner id: '+bookOwner,function(error) {if (error) throw error;});
							    });
					        });
					    });
			        });
		        });
	        }else ws.send('Error: authentication required',function(error) {if (error) throw error;});
		});
		ws.on('close', function() {
	        console.log('Remove book: Client disconnected.');
	    });
	    ws.on('error', function() {
	        console.log('Remove book: ERROR');
	    });
	});
	app.ws('/removebook', function(ws, res){
		console.log('/removebook');
		var authedUserId = ws.upgradeReq.session.passport.user;
		ws.on('message', function(msg){
			console.log('remove book: '+msg);
			Users.find({_id: authedUserId}, function(err, docs) {
		    	if (err) throw err;
		    	var userBooks = docs[0].books;
		    	var updatedBooks = [];
		    	for (var i=0;i<userBooks.length;i++){
		    		if (userBooks[i].isbn13 != msg) updatedBooks.push(userBooks[i]);
		    	}
		    	Users.update({_id: authedUserId}, {$set:{books:updatedBooks}}, function(err,dt){
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
		ws.on('close', function() {
	        console.log('Edit user data: Client disconnected.');
	    });
	    ws.on('error', function() {
	        console.log('Edit user data: ERROR');
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
