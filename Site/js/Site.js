/* global $ */
var rootGeneratorPath = "";
var rootGeneratorName = "";

$( document ).ready(function( $ ) {
  //Load up all generators that will be used
  rootGeneratorPath = $("#GeneratorFile").val();
  rootGeneratorName = $("#GeneratorName").val();  
    
  loadGenerator(rootGeneratorPath);
    
  //Because the generators are loaded through ajax we wait until  
  //all ajax activity has stopped before starting to attempt generating
  $( document ).ajaxStop(function() {
    generateContent();
  });
});

function generateContent()
{
    var generatedContent = generateFromTable(rootGeneratorName);
    $("#content").empty();
    $("#content").append(generatedContent);
}