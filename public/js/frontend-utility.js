$(document).ready(function(){
	var urlHash = window.location.hash;
	console.log('url hash: '+urlHash);
	if (urlHash == '#already-exists') {
		$('#dialog').html('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Not added</strong> You already possess the book you are trying to add.</div>');
		setTimeout(function(){
		    $('#dialog').html('');
		    window.location.hash = '';
	    },5000);
	}
});
function removeBook(obj){
	console.log($('.books').children().length);
	var mediaContainer = $('#'+obj.id).parent().parent().parent();
	console.log(mediaContainer.attr('id'));
	var bookISBN13 = mediaContainer.find('#book_isbn13').html();
	var bookOwnerId = $('#profile-id').html();
	console.log('data removal invoked, owner id: '+bookOwnerId+', book\'s isbn13: '+bookISBN13);
	var connRemove = new WebSocket("wss://book-trading-club-rfprod.c9users.io/removebook");
    connRemove.onopen = function(){
	    console.log("Removing book. Connection opened");
	    connRemove.send(bookOwnerId+'|'+bookISBN13);
    }
    connRemove.onmessage = function(evt){
	    console.info("Received "+JSON.stringify(evt.data));
	    mediaContainer.remove();
	    console.log($('.books').children().length);
	    $('#profile-books').html($('#profile-books').html()-1);
	    if ($('.books').children().length == 0) {
	    	$('.books').html('You do not own any books yet.');
	    }
	    connRemove.close();
    };
    connRemove.onerror = function(error){
	    console.error("Error:"+JSON.stringify(error));
	    connRemove.close();
    };
    connRemove.onclose = function(){
	    console.log("Stock removed. Connection closed");
    };
}