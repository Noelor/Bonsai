/* global $ */
var generatorsTable = {};

//Load a table type generator
function loadTable(filePath) {		
	$.getJSON( filePath, function(table) {		
		if(table.Name in generatorsTable == false)
		{
			generatorsTable[table.Name] = table.Data;
			console.log(table.Name + " loaded")
		}
		
		//Load listed dependencies, if any	
		if("Dependencies" in table)
		{
			var dependencies = table.Dependencies.split(";");
			$.each(dependencies, function(_,dependency)
			{
				loadTable(dependency);
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
				
				
				var regex = /\$(\w)-(\w+)\$/g;
				var match;																		
				//Modifying the original string during regex.exec resets the progress.
				//So copy it and regex over the copy while modifying the original
				var regexString = randomEntry;  
												
				//Recurse for nested entries.
				while ((match = regex.exec(regexString)) !== null) {
					if(match[1] == "T")
					{						
						var insert = generateFromTable(match[2]);
						randomEntry= randomEntry.replace(match[0],insert);										
					}
					
				}
				
				//Add to content																	
				content += randomEntry;
			});
						
			return content;
		}else{
			console.error("Generator " + tableName + " is not loaded.")
		}
		
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