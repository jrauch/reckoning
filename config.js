var tabRegex = [{name: "Jira", regex: /^http.*\/\/\w*.atlassian.net\/jira.*$/, color: "red"},
                {name: "GDocs", regex: /^http.*\/\/docs.google.com\/document.*$/, color: "blue"},
                {name: "GSheets", regex: /^http.*\/\/docs.google.com\/spreadsheets.*$/, color: "green"}];

function save_config() {
	var regexes = [];
	var table=document.getElementById("config-table");

	Array.from(table.rows).forEach(function(row, index){
		cells = row.getElementsByTagName("td");
		if(cells.length > 0)
    		regexes.push({name: cells[0].children[0].value, regex: cells[1].children[0].value})
  	});

	chrome.storage.local.set({regexes: regexes}, function() {
		var status = document.getElementById('status');
		status.textContent = 'Config saved';
		setTimeout(function() { status.textContent=''}, 750);
	});
}

function restore_config() {
	chrome.storage.sync.get(
		["regexes"]
	);
}

function add_row(name="", regex="") {
	var table = document.getElementById("config-table");
	var row = table.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	cell1.innerHTML = '<input type="text" id="name">';
	cell2.innerHTML = '<input type="text" id="regex">';
}



add_row();
document.getElementById('addrow').addEventListener('click', add_row);
document.getElementById('save').addEventListener('click', save_config);
document.getElementById('restore').addEventListener('click', restore_config);