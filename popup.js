function killByRegex(){
	chrome.tabs.query({}, 
		function (tabs) {
			regex = document.getElementById('regex').value;
			if ( regex !== "") {
				tabs.forEach(function(tab, index) {
					//console.log(tab.url);
      				if(tab.url.match(regex)) {
        				chrome.tabs.remove(tab.id);
      				}
  				});
  				window.close();
			}
		});
}

document.getElementById('execute').addEventListener('click', killByRegex);

var input = document.getElementById("regex");

// Execute a function when the user presses a key on the keyboard
input.addEventListener("keypress", function(event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("execute").click();
  }
});