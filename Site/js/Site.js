/* global $ */
$( document ).ready(function( $ ) {
  //Load up all generators that will be used
  loadGenerator("generators\\table\\Names.json");
  
  
  //Because the generators are loaded through ajax we wait until  
  //all ajax activity has stopped before starting to attempt generating
  $( document ).ajaxStop(function() {
    var generatedContent = generateFromTable("Names");
    $("#content").append(generatedContent);
  });
});