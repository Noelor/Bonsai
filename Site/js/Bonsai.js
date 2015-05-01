/* global $ */
var generatorsTable = {};

//Load a table type generator
function loadTable(filePath) {
	$.getJSON( filePath, function(table) {
		if(table.Name in generatorsTable == false)
		{
			generatorsTable[table.Name] = table.Data;						
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
				var totalWeight = totalWeightTableSection(section);
				var randomEntry = getRandomTableSectionEntryByWeight(section, totalWeight);
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