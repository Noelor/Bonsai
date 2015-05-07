/* global $ */
var rootGeneratorPath = "";
var rootGeneratorName = "";

$( document ).ready(function( $ ) {
  //Grab generator information from ulr or fallback to default on defined on page
  var generator = getUrlParameter("gen");  
  if(generator)
  {    
    rootGeneratorPath = "generators/content/" + generator + ".json";
  }else
  {    
    rootGeneratorPath = $("#DefaultFile").val();    
  }
        
  //Load up root generator that will be used  
  loadGenerator(rootGeneratorPath,function(generatorName)
  {
    rootGeneratorName = generatorName;
  });
    
  //Because the generators are loaded through ajax we wait until  
  //all ajax activity has stopped before starting to attempt generating
  $( document ).ajaxStop(function() {
    var info = getContentPageInformation(rootGeneratorName);
           
    $("#BonsaiTitle").html(info.Title);
    $("#BonsaiDescription").html(info.Description);
    
    $("#GeneratorButton").show();
        
    generateContent();
  });
});

function generateContent()
{
    var generatedContent = generateFromContent(rootGeneratorName);
    $("#BonsaiContent").html(generatedContent);
    
}

//Source: http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html through http://stackoverflow.com/questions/19491336/get-url-parameter-jquery
function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}