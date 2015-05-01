/* global $ */
var generatorsTable = {};

function loadTable(filePath) {
	$.getJSON( filePath, function(table) {
		if(table.Name in generatorsTable == false)
		{
			generatorsTable[table.Name] = table.Data;						
		}	
	});
}

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

function getRandomTableSectionEntryByWeight(section, totalweight)
{
	var r = Math.floor((Math.random() * totalweight));	
	var returnText = "";
	var finished = false;	
	
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