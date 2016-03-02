/* global $ */
var generatorsTable = {};
var generatorsContent = {};
var contentVariables = {};

var poolName = "None";
var exlusivePools = {};

//Load a table type generator
function loadGenerator(filePath,callBack) {		
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
                    loadGenerator(dependency);
                });    
            }            
		}
		
		if(callBack)
		{
			callBack(Generator.Name);
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
function generateFromContent(contentName, clearData = false)
{
	if(contentName in generatorsContent)
	{
		var content = "";
		                
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
                    contentVariables[name] = processNestedEntries(value);                                                    
                }
            });
        }
        
		$.each(contentGenerator.Data, function(key,section){
			
            //Check if this is going into an exlusivity pool
            if("Exclusive" in section)
            {
                poolName = section.Exclusive;                
            }else
            {
                poolName = "None";                
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
				section.MaxAmount = 1;
			
			if("ParagraphType" in section == false)
				section.ParagraphType = "Paragraph";
			            
			//Dispatch to specific paragraph type methods
			if(section.ParagraphType == "Paragraph" || section.ParagraphType == "Paragraph-Start" 
			|| section.ParagraphType == "Paragraph-End")
			{
				content += generateContentParagraph(section);
			}else if(section.ParagraphType == "DoubleList" || section.ParagraphType == "DoubleList-Start"){
                content += generateContentList(section,true);
            }else if (section.ParagraphType == "List" || section.ParagraphType == "List-Start" 
			|| section.ParagraphType == "List-End") {
				content += generateContentList(section);
			}else{
				//Fallback to no decorations on unspecified type.
				content += generateContentUndecorated(section);
			}								
		});
				
		return content;
	}else{
		console.error("Content Generator " + contentName + " is not loaded.");
	}
}

//generate a Content Generator section with Paragraph decoration
function generateContentParagraph(section)
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
			content += processNestedEntries(section.Text);					
		}
		
		if(section.ParagraphType != "Paragraph-Start")
			content+="</p>";	
	}
	
	return content;
}

//generate a Content Generator section with List decorations
function generateContentList(section, doubleColumn = false)
{
	var content = "";
	var chanceR = Math.floor((Math.random() * 100) +1);	
	
	if( chanceR <= section.Chance)
	{		
		if(section.ParagraphType != "List-End")
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
        					
		var amountR = Math.floor((Math.random() * section.MaxAmount) + section.MinAmount);						
		
        for(var i = 0;  i<amountR; i++)
		{			
			content += "<li>" + processNestedEntries(section.Text) + "</li>";					
		}
		
        if(section.ParagraphType != "List-Start"  && section.ParagraphType != "DoubleList-Start")			
			content+="</ul>";
	}
	
	return content;	
}

//generate a Content Generator section without any decorations. 
function generateContentUndecorated(section)
{
	var content = "";
	var chanceR = Math.floor((Math.random() * 100) +1);	
	
	if( chanceR <= section.Chance)
	{				
		var amountR = Math.floor((Math.random() * section.MaxAmount) + section.MinAmount);						
		for(var i = 0;  i<amountR; i++)
		{			
			content += processNestedEntries(section.Text);					
		}		
	}
	
	return content;		
}

//Generate the text entries from a Table
function generateFromTable(tableName)
{	
		if(tableName in generatorsTable)
		{
			var content="";
			
			var table = generatorsTable[tableName];
			$.each(table, function(_, section)
			{
				if((typeof section ) === 'string')
				{
					content+= processNestedEntries(section);
				}else
				{
					//Grab a random entry from the section
					var totalWeight = totalWeightTableSection(section);				
					var randomEntry = getRandomTableSectionEntryByWeight(section, totalWeight);
					
					//Find any nested references to generators and process those.
					randomEntry = processNestedEntries(randomEntry);
									
					//Add to content																	
					content += randomEntry;
				}			
			});
						
			return content;
		}else{
			console.error("Table Generator " + tableName + " is not loaded.");
		}
		
}

function generateIndex(indexTable,doubleColumn = false)
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
function processNestedEntries(entry)
{
	var regex = /\$(\w)-(\w+)\$/g;
	var match;																		
	//Modifying the original string during regex.exec resets the progress.
	//So copy it and regex over the copy while modifying the original
	var regexString = entry;  
									
	//Recurse for nested entries.
	while ((match = regex.exec(regexString)) !== null) {
		var insertValue = processEntryMarkup(match);
        
        //If a poolname is set, ensure the value is exclusive before allowing it in.
        if( poolName != "None")
        {
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
                        insertValue = "Error";
                        console.debug ("Not enough possible variations for exclusive pool");
                        break;
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


function getRandomNumberInclusive(min, max) {    
    min = Number(min);
    max = Number(max);
    
    var r   =  Math.floor(Math.random() * (max - min + 1)) + min;       
    return r;
}