/* global $ */
$( document ).ready(function( $ ) {
  loadTable("generators\\table\\names.json");
  
  
  
  $( document ).ajaxStop(function() {
    var generatedContent = generateFromTable("FirstNames");
    $("#content").append(generatedContent);
  });
});