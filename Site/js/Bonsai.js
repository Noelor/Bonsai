/* global $ */
var generatorsTable = {};
var generatorsContent = {};

//Load a table type generator
function loadGenerator(filePath) {		
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
					generatorsContent[Generator.Name] = Generator.Data;
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
			var dependencies = Generator.Dependencies.split(";");
			$.each(dependencies, function(_,dependency)
			{
				loadGenerator(dependency);
			});
		}
	});
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
				//Grab a random entry from the section
				var totalWeight = totalWeightTableSection(section);				
				var randomEntry = getRandomTableSectionEntryByWeight(section, totalWeight);
				
				//Find any nested references to generators and process those.
				randomEntry = processNestedEntries(randomEntry)
								
				//Add to content																	
				content += randomEntry;
			});
						
			return content;
		}else{
			console.error("Generator " + tableName + " is not loaded.");
		}
		
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
		if(match[1] == "T")
		{						
			var insert = generateFromTable(match[2]);
			entry = entry.replace(match[0],insert);										
		}else if(match[1] == "C")
		{
			//var insert = generateFromTable(match[2]);
			//entry = entry.replace(match[0],insert);
		}
		
	}
	
	return entry;
}

//Add up all the weight in a Sections
function totalWeightTableSection(section)
{
	var weight = 0;
	
	//weight is not relevant if there is only one entry 
	//one entry sections can exist to include a whitespace or fixed strings.
	if(Object.keys(section).length == 1)
	{
		return 1;
	}
	
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