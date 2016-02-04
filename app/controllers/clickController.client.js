'use strict';

(function () {
   var aggrButton = document.querySelector('.btn-aggregate-options');
   var findButton = document.querySelector('.btn-find-zero-votes');
   var aggrOut = document.querySelector('#aggregate-output');
   var apiUrl = appUrl + '/api/:id/clicks';
   function updateAggrData (data) {
      var clicksObject = JSON.parse(data);
      var str = "";
      clicksObject.forEach(function(entry){
         str += "<li class='list-group-item'><strong>"+entry.displayName+"</strong> has <strong>"+entry.numberOfOptions+"</strong> options</li>";
      });
      aggrOut.innerHTML = str;
   }
   function updateFindData (data) {
      var clicksObject = JSON.parse(data);
      var str = "";
      clicksObject.forEach(function(entry){
         str += "<li class='list-group-item'><strong>"+entry.displayName+"</strong> has <strong>0</strong> votes</li>";
      });
      aggrOut.innerHTML = str;
   }
   //ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiUrl, updateClickCount));
   aggrButton.addEventListener('click', function(){
      //ajaxFunctions.ajaxRequest('POST', apiUrl, function(){
         ajaxFunctions.ajaxRequest('GET', apiUrl, updateAggrData);
      //});
   }, false);
   findButton.addEventListener('click', function(){
      //ajaxFunctions.ajaxRequest('DELETE', apiUrl, function(){
         ajaxFunctions.ajaxRequest('DELETE', apiUrl, updateFindData);
      //});
   }, false);
})();
