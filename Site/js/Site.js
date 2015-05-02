/* global $ */
var rootGeneratorPath = "";
var rootGeneratorName = "";

$( document ).ready(function( $ ) {
  //Grab generator information from page
  rootGeneratorPath = $("#GeneratorFile").val();  
  //Load up root generator that will be used  
  loadGenerator(rootGeneratorPath,function(generatorName)
  {
    rootGeneratorName = generatorName;
  });
    
  //Because the generators are loaded through ajax we wait until  
  //all ajax activity has stopped before starting to attempt generating
  $( document ).ajaxStop(function() {
    generateContent();
  });
});

function generateContent()
{
    var generatedContent = generateFromContent(rootGeneratorName);
    $("#BonsaiContent").empty();
    $("#BonsaiContent").append(generatedContent);
}