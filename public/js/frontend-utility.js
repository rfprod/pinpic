$(document).ready(function(){
	var urlHash = window.location.hash;
	console.log('url hash: '+urlHash);
	if (urlHash == '#already-exists') {
		window.location.hash = '';
		$('#dialog').html('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Not added</strong> You already possess the book you are trying to add.</div>');
	}
	$('#dialog').bind('DOMSubtreeModified', function() {
	    console.log('tree changed');
	    if ($('#dialog').html() != ''){
			setTimeout(function(){
			    $('#dialog').html('');
		    },5000);
		}
	});
});
function removeBook(obj){
	console.log($('.books').children().length);
	var mediaContainer = $('#'+obj.id).parent().parent().parent();
	console.log(mediaContainer.attr('id'));
	var bookISBN13 = mediaContainer.find('#book_isbn13').html();
	console.log('book removal invoked, isbn13: '+bookISBN13);
	var conRemoveBook = new WebSocket("wss://book-trading-club-rfprod.c9users.io/removebook");
    conRemoveBook.onopen = function(){
	    console.log("Removing book. Connection opened");
	    conRemoveBook.send(bookISBN13);
    }
    conRemoveBook.onmessage = function(evt){
	    console.info("Received "+JSON.stringify(evt.data));
	    mediaContainer.remove();
	    console.log($('.books').children().length);
	    $('#profile-books').html($('#profile-books').html()-1);
	    if ($('.books').children().length == 0) {
	    	$('.books').html('You do not own any books yet.');
	    }
	    conRemoveBook.close();
    };
    conRemoveBook.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    conRemoveBook.close();
    };
    conRemoveBook.onclose = function(){
	    console.log("Stock removed. Connection closed");
    };
}
function emailSignup(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	console.log(formContainer.attr('id'));
	var emailSignup = formContainer.find('#email-signup');
	var passSignup = formContainer.find('#password-signup');
	var passRepeatSignup = formContainer.find('#password-repeat-signup');
	emailSignup.parent().attr('class','form-group');
	passSignup.parent().attr('class','form-group');
	passRepeatSignup.parent().attr('class','form-group');
	console.log('email signup invoked: '+emailSignup.val()+' ~ '+passSignup.val()+' ~ '+passRepeatSignup.val());
	var conEmailSignup = new WebSocket("wss://book-trading-club-rfprod.c9users.io/emailsignup");
    conEmailSignup.onopen = function(){
	    console.log("Email sign up. Connection opened");
	    conEmailSignup.send(emailSignup.val()+'|'+passSignup.val()+'|'+passRepeatSignup.val());
    }
    conEmailSignup.onmessage = function(evt){
    	var responseString = JSON.stringify(evt.data);
	    console.info("Received "+responseString);
	    if (responseString.indexOf('success') != -1){
	    	emailSignup.attr('value','Email');
		    passSignup.attr('value','Password');
		    passRepeatSignup.attr('value','Repeat password');
		    var successDialog = '<div class="alert alert-success alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Account created</strong> You can now Log In with your registered credentials.</div>';
			$('#dialog').html(successDialog);
	    }else if (responseString.indexOf('already exists') != -1){
		    emailSignup.parent().addClass('has-error').addClass('has-feedback');
	    	var existsDialog = '<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Already exists</strong> Account associated with this email already exists.</div>';
			$('#dialog').html(existsDialog);
	    }else if (responseString.indexOf('do not match') != -1){
	    	passSignup.parent().addClass('has-error').addClass('has-feedback');
		    passRepeatSignup.parent().addClass('has-error').addClass('has-feedback');
	    	var passMatchDialog = '<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Not created</strong> Passwords do not match.</div>';
			$('#dialog').html(passMatchDialog);
	    }
	    conEmailSignup.close();
    };
    conEmailSignup.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    conEmailSignup.close();
    };
    conEmailSignup.onclose = function(){
	    console.log("Email sugn up. Connection closed");
    };
}
function addBookByVolumeId(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	var bookISBN13 = obj.id;
	console.log('bookISBN13: '+bookISBN13);
	var conAddById = new WebSocket("wss://book-trading-club-rfprod.c9users.io/addbookbyisbn");
    conAddById.onopen = function(){
	    console.log("Add book by volume id. Connection opened");
	    conAddById.send(bookISBN13);
    }
    conAddById.onmessage = function(evt){
    	var responseString = JSON.stringify(evt.data);
	    console.info("Received "+responseString);
	    alert(responseString);
	    if (responseString.indexOf('not found') == -1){
		    var ownersDOM = formContainer.find('#book_owner');
		    ownersDOM.html(parseInt(ownersDOM.html(),10)+1);
		    var reqBookDOM = formContainer.find('.btn-request-book');
		    console.log(reqBookDOM.attr('id'));
			var addBookDOM = formContainer.find('.btn-add-book');
			console.log(addBookDOM.attr('id'));
			addBookDOM.addClass('disabled');
			reqBookDOM.html('You own the book');
			reqBookDOM.removeClass('btn-info').addClass('btn-success');
			reqBookDOM.addClass('disabled');
	    }
	    conAddById.close();
    };
    conAddById.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    conAddById.close();
    };
    conAddById.onclose = function(){
	    console.log("Add book by volume id. Connection closed");
    };
}
function requestBook(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	var bookISBN13 = obj.id;
	console.log('bookISBN13: '+bookISBN13);
	var conRequestBook = new WebSocket("wss://book-trading-club-rfprod.c9users.io/requestbook");
    conRequestBook.onopen = function(){
	    console.log("Add book by isnb13. Connection opened");
	    conRequestBook.send(bookISBN13);
    }
    conRequestBook.onmessage = function(evt){
    	var responseString = JSON.stringify(evt.data);
	    console.info("Received "+responseString);
	    alert(responseString);
	    if (responseString.indexOf('Error') == -1){
		    var reqBookDOM = formContainer.find('.btn-request-book');
		    console.log(reqBookDOM.attr('id'));
			var addBookDOM = formContainer.find('.btn-add-book');
			console.log(addBookDOM.attr('id'));
			addBookDOM.addClass('disabled');
			reqBookDOM.html('You requested the book');
			reqBookDOM.removeClass('btn-info').addClass('btn-warning');
			reqBookDOM.addClass('disabled');
	    }
	    conRequestBook.close();
    };
    conRequestBook.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    conRequestBook.close();
    };
    conRequestBook.onclose = function(){
	    console.log("Add book by isbn13. Connection closed");
    };
}
function cancelRequest(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	console.log(formContainer);
	var bookISBN13 = obj.id;
	console.log('bookISBN13: '+bookISBN13);
	var conCalcelRequest = new WebSocket("wss://book-trading-club-rfprod.c9users.io/cancelrequest");
    conCalcelRequest.onopen = function(){
	    console.log("Cancel book request. Connection opened");
	    conCalcelRequest.send(bookISBN13);
    }
    conCalcelRequest.onmessage = function(evt){
    	var responseString = JSON.stringify(evt.data);
	    console.info("Received "+responseString);
	    alert(responseString);
	    formContainer.remove();
	    $('#profile-out-offers').html(parseInt($('#profile-out-offers').html(),10)-1);
	    conCalcelRequest.close();
    };
    conCalcelRequest.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    conCalcelRequest.close();
    };
    conCalcelRequest.onclose = function(){
	    console.log("Cancel book request. Connection closed");
    };
}
function acceptOffer(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	console.log(formContainer);
	var offersCheckboxes = formContainer.find('input');
	console.log('offersCheckboxes');
	console.log(offersCheckboxes);
	console.log('is checked: '+offersCheckboxes[0].checked);
	var offerID = null;
	for (var o in offersCheckboxes){
		if (offersCheckboxes[o].checked == true) offerID = offersCheckboxes[o].id;
	}
	console.log('offerID: '+offerID);
	if (offerID == null) alert('You must select an incoming offer to perform an action.');
	else {
		var conAceptOffer = new WebSocket("wss://book-trading-club-rfprod.c9users.io/acceptoffer");
	    conAceptOffer.onopen = function(){
		    console.log("Accept offer. Connection opened");
		    conAceptOffer.send(offerID);
	    }
	    conAceptOffer.onmessage = function(evt){
	    	var responseString = JSON.stringify(evt.data);
		    console.info("Received "+responseString);
		    alert(responseString);
		    formContainer.remove();
		    $('#profile-in-offers').html(parseInt($('#profile-in-offers').html(),10)-offersCheckboxes.length);
		    conAceptOffer.close();
	    };
	    conAceptOffer.onerror = function(error){
		    console.error("Error:"+JSON.stringify(error));
		    conAceptOffer.close();
	    };
	    conAceptOffer.onclose = function(){
		    console.log("Accept offer. Connection closed");
	    };
	}
}
function rejectOffer(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	console.log(formContainer);
	var offersCheckboxes = formContainer.find('input');
	console.log('offersCheckboxes');
	console.log(offersCheckboxes);
	console.log('is checked: '+offersCheckboxes[0].checked);
	var offerID = null;
	for (var o in offersCheckboxes){
		if (offersCheckboxes[o].checked == true) offerID = offersCheckboxes[o].id;
	}
	console.log('offerID: '+offerID);
	if (offerID == null) alert('You must select an incoming offer to perform an action.');
	else {
		var conAceptOffer = new WebSocket("wss://book-trading-club-rfprod.c9users.io/rejectoffer");
	    conAceptOffer.onopen = function(){
		    console.log("Reject offer. Connection opened");
		    conAceptOffer.send(offerID);
	    }
	    conAceptOffer.onmessage = function(evt){
	    	var responseString = JSON.stringify(evt.data);
		    console.info("Received "+responseString);
		    alert(responseString);
		    formContainer.find('#'+offerID).parent().parent().remove();
		    if (offersCheckboxes.length-1 == 0) {
		    	formContainer.find('#accept-offer-'+offerID).addClass('disabled');
		    	formContainer.find('#accept-offer-'+offerID).attr('onclick','');
		    	formContainer.find('#reject-offer-'+offerID).addClass('disabled');
		    	formContainer.find('#reject-offer-'+offerID).attr('onclick','');
		    }
		    $('#profile-in-offers').html(parseInt($('#profile-in-offers').html(),10)-offersCheckboxes.length);
		    conAceptOffer.close();
	    };
	    conAceptOffer.onerror = function(error){
		    console.error("Error:"+JSON.stringify(error));
		    conAceptOffer.close();
	    };
	    conAceptOffer.onclose = function(){
		    console.log("Reject offer. Connection closed");
	    };
	}
}