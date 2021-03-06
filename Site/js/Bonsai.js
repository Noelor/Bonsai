/* global $ */
var generatorsTable = {};
var generatorsContent = {};
var contentVariables = {};
var fetchedURIs = [];
var exlusivePools = {};

//Load a table type generator
function loadGenerator(filePath,loadingMessageCallback, rootNameCallBack) {		
	$.getJSON( filePath, function(Generator) {		
		if(Generator.Type)
		{
			if(Generator.Type == "Table")
			{
				if(Generator.Name in generatorsTable == false)
				{
					generatorsTable[Generator.Name] = Generator.Data;
					console.log(Generator.Name + " loaded");
				}
			}else
			{
				if(Generator.Name in generatorsContent == false)
				{
					generatorsContent[Generator.Name] = Generator;
					console.log(Generator.Name + " loaded");
				}
			}
		}else
		{
			console.error("Missing type in " + filePath + " file, can't load.");
		}
					
		//Load listed dependencies, if any	
		if("Dependencies" in Generator)
		{
			if( Generator.Dependencies != "")
            {
                var dependencies = Generator.Dependencies.split(";");
                $.each(dependencies, function(_,dependency)
                {
                    if(dependency && $.inArray(dependency,fetchedURIs) == -1)
                    {
                        loadGenerator(dependency,loadingMessageCallback);
                        fetchedURIs.push(dependency);
                    }
                    
                });    
            }            
		}
		
		if(rootNameCallBack)
		{
			rootNameCallBack(Generator.Name);
		}
        
        if(loadingMessageCallback)
		{
			loadingMessageCallback(Generator.Name);
		}
	}).fail(function( jqxhr, textStatus, error ) {
    	var err = textStatus + ", " + error;
    	console.log( "Request Failed: " + err );
	});
}

//Get the title and description of a Content Generator
function getContentPageInformation(contentName)
{
	var Information = {};
	
	if(contentName in generatorsContent)
	{
		var contentGenerator = generatorsContent[contentName];
					
		if("Title" in contentGenerator)
		{
			Information["Title"] = contentGenerator["Title"];									
		}
		
		if("Description" in contentGenerator)
		{
			Information["Description"] = contentGenerator["Description"];
		}
		
		if("ButtonText" in contentGenerator)
		{
			Information["ButtonText"] = contentGenerator["ButtonText"];
		}else
		{
			Information["ButtonText"] = "Again";
		}
				
	}else{
		console.error("Content Generator " + contentName + " is not loaded.");
	}
	
	return Information;
}

//Generate the text entries from a Content Generator
function generateFromContent(contentName, clearData)
{
	if(contentName in generatorsContent)
	{
		var content = "";
		var poolName = "None";            
		var contentGenerator = generatorsContent[contentName];
        
        if(clearData)
        {
            contentVariables = {};
            exlusivePools = {}           
        }
        
        //Process Variables, for use in markup.
        if("Variables" in contentGenerator)
        {
            $.each(contentGenerator.Variables, function(name,value){
                if(name in contentVariables == false)
                {
                    contentVariables[name] = processNestedEntries(value,"None");                                                    
                }
            });
        }
        
		$.each(contentGenerator.Data, function(key,section){
			var sectionContent = "";
            
            
            //Check if this is going into an exlusivity pool
            if("Exclusive" in section)
            {
                poolName = section.Exclusive;                
            }
            
                        
			//Select one of the options in a -Choice sections, by weight.
			if("TextTable" in section)
			{				
				var totalWeight = totalWeightTableSection(section.TextTable);				
				section.Text = getRandomTableSectionEntryByWeight(section.TextTable, totalWeight);
			}else if("TextIndex" in section)
			{
				var doubleIndex= false;
                if(section.ParagraphType == "DoubleIndex")
                    doubleIndex = true;
                
                section.Text = generateIndex(section.TextIndex,doubleIndex);
				                
			}
			
			//set properties not specified in json to default
			if("Chance" in section == false)
				section.Chance = 100;
			
			if("MinAmount" in section == false)
				section.MinAmount = 1;
			
			if("MaxAmount" in section == false)
				section.MaxAmount = section.MinAmount;
			
			if("ParagraphType" in section == false)
				section.ParagraphType = "Paragraph";
			            
			//Dispatch to specific paragraph type methods
			if(section.ParagraphType == "Paragraph" || section.ParagraphType == "Paragraph-Start" 
			|| section.ParagraphType == "Paragraph-End")
			{
				sectionContent += generateContentParagraph(section,poolName);
			}else if(section.ParagraphType == "DoubleList" || section.ParagraphType == "DoubleList-Start"){
                sectionContent += generateContentList(section,true,poolName);
            }else if (section.ParagraphType == "List" || section.ParagraphType == "List-Continues" || section.ParagraphType == "List-Start" 
			|| section.ParagraphType == "List-End") {
				sectionContent += generateContentList(section,false,poolName);
			}else if(section.ParagraphType == "CommaSeperatedList"){
                sectionContent += generateContentCommaSeperated(section,poolName);              
            }else{
				//Fallback to no decorations on unspecified type.
				sectionContent += generateContentUndecorated(section,poolName);
			}
                             
            if("SentenceCase" in section == true)
            {               
 
                if(section.SentenceCase == "Title-Case")
                { 
                    sectionContent = sectionContent.toLowerCase().toTitleCase();
                }else if(section.SentenceCase == "Sentence")
				{
					sectionContent = sectionContent.toSentenceCase();
				}
            }
            
            content += sectionContent; 								
		});
				
		return content;
	}else{
		console.error("Content Generator " + contentName + " is not loaded.");
	}
}

function generateOptionalInlineContent(filePath,idNumber)
{
    var rootGeneratorName;
    var button = document.getElementById("OptionalInclusive" + idNumber);       
    var div = document.createElement("div");
    
    div.className = "OptionalInlineContent";    
    
    loadGenerator(filePath,function(generatorName){},function(generatorName)
    {
        rootGeneratorName = generatorName;        
    });
    
    $( document ).ajaxStop(function() {
         $(this).unbind("ajaxStop");
        div.innerHTML = generateFromContent(rootGeneratorName, true);
        button.parentNode.insertBefore(div, button.nextSibling);
        
        button.style.display = 'none'; 
    });
}

//generate a Content Generator section with Paragraph decoration
function generateContentParagraph(section, poolName)
{
	var content = "";
	var chanceR = Math.floor((Math.random() * 100) +1);	
	
	if( chanceR <= section.Chance)
	{		
		if(section.ParagraphType != "Paragraph-End")
			content+="<p>";
						
		var amountR = Math.floor((Math.random() * section.MaxAmount) + section.MinAmount);						
		for(var i = 0;  i<amountR; i++)
		{			
			content += processNestedEntries(section.Text,poolName);					
		}
		
		if(section.ParagraphType != "Paragraph-Start")
			content+="</p>";	
	}
	
	return content;
}

//generate a Content Generator section with List decorations
function generateContentList(section, doubleColumn, poolName)
{
	var content = "";
	var chanceR = Math.floor((Math.random() * 100) +1);	
	
	if( chanceR <= section.Chance)
	{		
		if(section.ParagraphType != "List-End" && section.ParagraphType != "List-Continues")
        {
            if(doubleColumn)
            {
                content+="<ul class='Double-List'>";
            }
            else
            {
                content+="<ul>";    
            }                        
        }
        					
		var amountR = getRandomNumberInclusive(section.MinAmount,section.MaxAmount); 
        								
        for(var i = 0;  i<amountR; i++)
		{			
			content += "<li>" + processNestedEntries(section.Text,poolName) + "</li>";					
		}
		
        if(section.ParagraphType != "List-Start"  && section.ParagraphType != "DoubleList-Start" && section.ParagraphType != "List-Continues")			
			content+="</ul>";
	}
	
	return content;	
}

function generateContentCommaSeperated(section, poolName)
{
    var content = [];
	var chanceR = Math.floor((Math.random() * 100) +1);	
	
	if( chanceR <= section.Chance)
	{				
		var amountR = getRandomNumberInclusive(section.MinAmount,section.MaxAmount);						
		for(var i = 0;  i<amountR; i++)
		{			
			content.push(processNestedEntries(section.Text,poolName));					
		}		
	}
	
	return content.join(", ");	
}

//generate a Content Generator section without any decorations. 
function generateContentUndecorated(section, poolName)
{
	var content = "";
	var chanceR = Math.floor((Math.random() * 100) +1);	
	
	if( chanceR <= section.Chance)
	{				
		var amountR = getRandomNumberInclusive(section.MinAmount,section.MaxAmount);						
		for(var i = 0;  i<amountR; i++)
		{			
			content += processNestedEntries(section.Text,poolName);					
		}		
	}
	
	return content;		
}

//Generate the text entries from a Table
function generateFromTable(tableName, poolName)
{	
		if(tableName in generatorsTable)
		{
			var content="";
			
			var table = generatorsTable[tableName];
			$.each(table, function(_, section)
			{
				if((typeof section ) === 'string')
				{
					content+= processNestedEntries(section,poolName);
				}else
				{
					//Grab a random entry from the section
					var totalWeight = totalWeightTableSection(section);				
					var randomEntry = getRandomTableSectionEntryByWeight(section, totalWeight);
					
					//Find any nested references to generators and process those.
					randomEntry = processNestedEntries(randomEntry,poolName);
									
					//Add to content																	
					content += randomEntry;
				}			
			});
						
			return content;
		}else{
			console.error("Table Generator " + tableName + " is not loaded.");
		}
		
}

function generateIndex(indexTable,doubleColumn)
{
	var text = "";	
	if(doubleColumn)
    {
        text +="<ul class='indexList Double-List'>";
    }
    else
    {
        text += "<ul class='indexList'>";    
    }
    	
	$.each(indexTable, function(_, value){
		$.each(value, function(k,v){
			text += "<li> <a href='"+ v +"'>"+ k +"</a> </li>";
		});
		
	});
	
	text += "</ul>";	
	return text;
}

//Find references to generators in a string and replace them with the generators content
function processNestedEntries(entry, poolName)
{
	var regex = /\$(\w)-([\w\.\/]+)\$/g;
	var match;																		
	//Modifying the original string during regex.exec resets the progress.
	//So copy it and regex over the copy while modifying the original
	var regexString = entry;  
									
	//Recurse for nested entries.
	while ((match = regex.exec(regexString)) !== null) {
		var insertValue = processEntryMarkup(match);
        
        //If a poolname is set, ensure the value is exclusive before allowing it in.
        if(poolName && poolName != "None")
        {
            //console.log("Pool: " + poolName)
            if( poolName in exlusivePools )
            {                
                var i = 100 ; // Max Retry attempts.
                while($.inArray(insertValue, exlusivePools[poolName]) != -1)
                {                    
                    insertValue = processEntryMarkup(match);
                    i--;
                    
                    //Abort if no new values found after to many attempts, throw an error on the log
                    if( i < 0)
                    {
                        console.log("Duplicate: " + insertValue + " vs " + exlusivePools[poolName])
                        return entry;
                    }                                                           
                }
                
                exlusivePools[poolName].push(insertValue); 
                //console.log(exlusivePools[poolName]);                
            }
            else  
            {
                exlusivePools[poolName] = [];
                exlusivePools[poolName].push(insertValue);   
            }
        }
        
        //finally replace value
        entry = entry.replace(match[0],insertValue);		
	}	
	return entry;
}

//Given a regex match for markup, returns a valid replacement value.
function processEntryMarkup(match)
{
    var text = "Markup Replacement Error for: " + match[0];
    
    if(match[1] == "T") //Table Entry
    {						
        text = generateFromTable(match[2]);													
    }else if(match[1] == "C") //Content Entry
    {
        text = generateFromContent(match[2]);       
    }
    else if(match[1] == "R") //Random Number
    {
        var numbers = match[2].split("_");            						
        var r = getRandomNumberInclusive(numbers[0],numbers[1]);                      
        text = "" + r;
    }else if(match[1] == "V") //Variable
    {			
        text = contentVariables[match[2]];
    }else if(match[1] == "O") //Optional Inline Content
    {			        
        var e = match[2].split("_");
        rId = getRandomNumberInclusive(1,10000);
        text = "<button id='OptionalInclusive{1}' onclick=generateOptionalInlineContent('{2}',{1})>{0}</button>".format(e[1],rId,e[0])
    }
    
    return text;
}

//Add up all the weight in a Sections
function totalWeightTableSection(section)
{
	var weight = 0;
			
	$.each(section, function(_, entry)
	{		
		$.each(entry, function(_,w){
			weight+=w;
		});
	});	
	
	return weight;
}

//Return an entry from a Table Section randomly but modified by weight. 
function getRandomTableSectionEntryByWeight(section, totalweight)
{
	
	var r = Math.floor((Math.random() * totalweight));	
	var returnText = "";
	var finished = false; //Can't neatly break out of a jquery .each so use a manual termination.
	
	$.each(section, function(_, entry)
	{		
		$.each(entry, function(text,weight){						
			
			if( r < weight && 1 && !finished)
			{					
				returnText = text;
				finished = true;									
			}else if(!finished)
			{			
				r-= weight;
			}
		});
	});	 
	
	return returnText;
}

function doesStringProbablyIncludeHTML(str)
{
	if (str.match("[<>=]")) {				
		return true;
	}
	return false;
}

function getRandomNumberInclusive(min, max) {    
    min = Number(min);
    max = Number(max);
    
    var r   =  Math.floor(Math.random() * (max - min + 1)) + min;       
    return r;
}

String.prototype.format = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};


//Source: http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
String.prototype.toTitleCase = function() {
	// Certain minor words should be left lowercase unless 
  	// they are the first or last words in the string
  	lowers = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'as', 'at', 
  	'by', 'for', 'from', 'in', 'into', 'near', 'of', 'on', 'onto', 'to', 'with'];
  
	var correctedStr = this.trim();
	correctedStr = correctedStr.replace(/</g, " <" );
	correctedStr = correctedStr.replace(/>/g, "> " );
	
	var words=correctedStr.split(" ");
	var str = "";
	
	for(i=0;i<words.length;i++)
	{		
		if(words[i] &&  !doesStringProbablyIncludeHTML(words[i]) )
		{
			if($.inArray(words[i].toLowerCase(), lowers ) == -1) 
			{				
				console.log(words[i])
				words[i] = words[i][0].toUpperCase() + words[i].substring(1)		
			}
		
		}
		
		str = str + words[i] + " "
	}
	
	return str;
}

String.prototype.toSentenceCase = function() {
	var correctedStr = this.trim();
	correctedStr = correctedStr.replace(/</g, " <" );
	correctedStr = correctedStr.replace(/>/g, "> " );
	
	var sentences=correctedStr.split(".");
	var str = "";
	
	for(i=0;i<sentences.length;i++)
	{
		var setFirstwordCapital = false;
		var words = sentences[i].split(" ");
		var lastWord;
		for(j=0;j<words.length;j++)
		{												
			if(!setFirstwordCapital && !doesStringProbablyIncludeHTML(words[j]))
			{				
				if(words[j][0])
				{										
					words[j] = words[j][0].toUpperCase() + words[j].substr(1);
					setFirstwordCapital = true						
				}				
			}
			
			if(words[j] && !doesStringProbablyIncludeHTML(words[j]))
			{
				lastWord = words[j]
			}
						
			str = str + words[j] + " "			 
		}			
		
		if(lastWord)
		{
			lastWordIndex = str.lastIndexOf(lastWord);
			str = str.substring(0,lastWordIndex) + lastWord + "." + str.substring(lastWordIndex + lastWord.length);
			lastWord = "";	
		}				
	}		 	
	return str
}

