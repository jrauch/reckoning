var tabRegex = [{name: "Jira", regex: "^http.*//\w*.atlassian.net/jira.*$", color: "red"},
                {name: "GDocs", regex: "^http.*//docs.google.com/document.*$", color: "blue"},
                {name: "GSheets", regex: "^http.*//docs.google.com/spreadsheets.*$", color: "green"}];

function save_config() {
	var regexes = [];
	var table=document.getElementById("config-table");

	Array.from(table.rows).forEach(function(row, index){
		cells = row.getElementsByTagName("td");
		if(cells.length > 0)
    		regexes.push({name: cells[0].children[0].value, regex: cells[1].children[0].value, color: cells[2].children[0].value})
  	});

	chrome.storage.sync.set({regexes: regexes}, function() {
		var status = document.getElementById('status');
		status.textContent = 'Config saved';
		setTimeout(function() { status.textContent=''}, 750);
	});
}

function restore_config(restore=false) {
	chrome.storage.sync.get(
		"regexes", function(regexes) {
			var reop;
			reop = (regexes.regexes && restore == false)?regexes.regexes:tabRegex;
			reop.forEach(function(row, index) {
					add_row(name=row["name"], row["regex"], row["color"]);
			});
			 
		}
	);
}

function add_row(name="", regex="", color="") {
	var table = document.getElementById("config-table");
	var row = table.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);
	cell1.innerHTML = '<input type="text" id="name" value="'+name+'">';
	cell2.innerHTML = '<input type="text" id="regex" value="'+regex+'">';
	cell3.innerHTML = '<input type="text" id="color" value="'+color+'">';
}

restore_config();
document.getElementById('addrow').addEventListener('click', add_row);
document.getElementById('save').addEventListener('click', save_config);
document.getElementById('loaddefaults').addEventListener('click', function(event) {restore_config(true);});