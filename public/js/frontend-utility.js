$(document).ready(function(){
	var urlHash = window.location.hash;
	if (urlHash == '#already-exists') {
		$('#dialog').html('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Not added</strong> You already possess the book you are trying to add.</div>');
	}else if (urlHash == '#not-found') {
		$('#dialog').html('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Not added</strong> Nothing was found.</div>');
	}
	if (urlHash.length > 0) window.location.hash = '';
	
	var dialogChildrenCount = $('#dialog').children().length;
    if (dialogChildrenCount > 0){
		setTimeout(function(){
		    $('#dialog').html('');
	    },5000);
	}
	$('#add-pic-url').bind('input', function() {
	    if ($('#add-pic-url').val() == '') {
	    	$('#submit-btn').attr('disabled','disabled');
	    	$('#submit-btn').attr('onclick','');
	    }
		else {
			$('#submit-btn').removeAttr('disabled');
			$('#submit-btn').attr('onclick','addImageURL(this);');
		}
	});
	$('.grid').masonry({itemSelector: '.grid-item', percentPosition: true});
	console.log($('.grid').find('img'));
	$('.grid').find('img').each(function(){
		$(this).on("error", function () {
			console.log('error loading '+$(this).parent().attr('id')+' | '+$(this).parent());
			var height = $(this).height();
			var width = $(this).width();
			console.log('replacing image with dimensions: '+width+'/'+height);
			$(this).attr('src','');
			$(this).attr('data-src','holder.js/'+width+'x'+height+'?text=Broken');
		});
	});
});
function emailSignup(obj){
	console.log(obj);
	var formContainer = $('#'+obj.id).parent().parent().parent();
	console.log(formContainer.attr('id'));
	var emailPattern = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+.)+([a-zA-Z0-9]{2,4})+$/;
	var emailSignup = formContainer.find('#email-signup');
	if (emailPattern.test(emailSignup)){
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
	}else {
		emailSignup.parent().addClass('has-error').addClass('has-feedback');
		var invalidEmailDialog = '<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Not created</strong> Enter a valid email address, please.</div>';
		$('#dialog').html(invalidEmailDialog);
		setTimeout(function(){
		    $('#dialog').html('');
	    },5000);
	}
}
function addImageURL(obj){
	var grid = $('.grid');
	console.log(obj);
	var addPicURL = $('#add-pic-url').val();
	var urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
	if (urlPattern.test(addPicURL)) {
		console.log('adding picture url: '+addPicURL);
		var conAddURL = new WebSocket("wss://pinpincs-rfprod.c9users.io/pinpic");
	    conAddURL.onopen = function(){
		    console.log("Pin image by url. Connection opened");
		    conAddURL.send(addPicURL);
	    }
	    conAddURL.onmessage = function(evt){
	    	var responseString = evt.data;
	    	responseString = responseString.substring(25,responseString.length-14);
		    console.info("Received "+responseString);
		    if (responseString.indexOf('Error') == -1){
			    var profileLinks = $('#profile-links');
			    profileLinks.html(parseInt(profileLinks.html(),10)+1);
			    var $resObj = $(responseString);
				grid.append($resObj).masonry('appended', $resObj);
		    }else alert(responseString);
		    conAddURL.close();
	    };
	    conAddURL.onerror = function(error){
		    console.error("Error:"+JSON.stringify(error));
		    conAddURL.close();
	    };
	    conAddURL.onclose = function(){
		    console.log("Pin image by url. Connection closed");
	    };
	}else alert('Error: please provide a valid url.');
}
function removePin(obj){
	console.log(obj);
	var parentGridItem = $('#'+obj.id).parent();
	var pinId = obj.id;
	console.log('removing pin id: '+pinId);
	var conRequestBook = new WebSocket("wss://pinpincs-rfprod.c9users.io/removepin");
    conRequestBook.onopen = function(){
	    console.log("Remove pin by id. Connection opened");
	    conRequestBook.send(pinId);
    }
    conRequestBook.onmessage = function(evt){
    	var responseString = JSON.stringify(evt.data);
	    console.info("Received "+responseString);
	    if (responseString.indexOf('Error') == -1){
		    var profileLinks = $('#profile-links');
		    profileLinks.html(parseInt(profileLinks.html(),10)-1);
		    $('.grid').masonry('remove',parentGridItem);
		    setTimeout(function(){
			    $('#dialog').html('');
		    },5000);
	    }else alert(responseString);
	    conRequestBook.close();
    };
    conRequestBook.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    conRequestBook.close();
    };
    conRequestBook.onclose = function(){
	    console.log("Remove pin by id. Connection closed");
    };
}