'use strict';

(function () {
   var editUserExtendedButton = document.querySelector('.edit');
   var doneUserExtendedButton = document.querySelector('.done');
   var profileEmail = document.querySelector('#profile-email');
   var profileFullName = document.querySelector('#profile-fullname');
   var profileCity = document.querySelector('#profile-city');
   var profileState = document.querySelector('#profile-state');
   var apiUrl = appUrl + '/api/:id/clicks';
   function editUderExtended (data) {
      var clicksObject = JSON.parse(data);
      var str = "";
      clicksObject.forEach(function(entry){
         str += "<li class='list-group-item'><strong>"+entry.displayName+"</strong> has <strong>"+entry.numberOfOptions+"</strong> options</li>";
      });
      profileEmail.removeAttribute('readonly');
      profileFullName.removeAttribute('readonly');
      profileCity.removeAttribute('readonly');
      profileState.removeAttribute('readonly');
      editUserExtendedButton.style.display = 'none';
      doneUserExtendedButton.style.display = 'block';
   }
   function doneUserExtended(){
      profileEmail.setAttribute('readonly','readonly');
      profileFullName.setAttribute('readonly','readonly');
      profileCity.setAttribute('readonly','readonly');
      profileState.setAttribute('readonly','readonly');
      editUserExtendedButton.style.display = 'block';
      doneUserExtendedButton.style.display = 'none';
   }
   
   editUserExtendedButton.addEventListener('click', function(){
         ajaxFunctions.ajaxRequest('GET', apiUrl, editUderExtended);
   }, false);
   
   doneUserExtendedButton.addEventListener('click', function(){
      console.log('user data edit invoked, new data: '+profileEmail.value+'~'+profileFullName.value+'~'+profileCity.value+'~'+profileState.value);
		var connEditUser = new WebSocket("wss://pinpincs-rfprod.c9users.io/edituser");
	    connEditUser.onopen = function(){
		    console.log("Editing user data. Connection opened");
		    connEditUser.send(profileEmail.value+'|'+profileFullName.value+'|'+profileCity.value+'|'+profileState.value);
	    }
	    connEditUser.onmessage = function(evt){
		    console.info("Received "+JSON.stringify(evt.data));
		    doneUserExtended();
		    connEditUser.close();
	    };
	    connEditUser.onerror = function(error){
		    console.error("Error editing user data: "+JSON.stringify(error));
		    connEditUser.close();
	    };
	    connEditUser.onclose = function(){
		    console.log("User data edited. Connection closed");
	    };
   }, false);
})();