function previewMatches() {
	var regexStr = document.getElementById('regex').value;
	var statusDiv = document.getElementById('status');
	var previewDiv = document.getElementById('preview-results');

	// Clear previous results
	statusDiv.style.display = 'none';
	previewDiv.innerHTML = '';

	// Validate inputs
	if (!regexStr) {
		statusDiv.textContent = 'Please provide a regex pattern';
		statusDiv.className = 'error';
		statusDiv.style.display = 'block';
		return;
	}

	// Validate regex
	try {
		var regex = new RegExp(regexStr);
	} catch(e) {
		statusDiv.textContent = 'Invalid regex: ' + e.message;
		statusDiv.className = 'error';
		statusDiv.style.display = 'block';
		return;
	}

	// Query tabs and filter by regex
	chrome.tabs.query({windowType: 'normal'}, function(tabs) {
		console.log('Total tabs in normal windows:', tabs.length);
		var matchingTabs = [];

		tabs.forEach(function(tab) {
			if (tab.url.match(regex)) {
				matchingTabs.push({
					id: tab.id,
					title: tab.title,
					url: tab.url,
					windowId: tab.windowId
				});
			}
		});

		console.log('Matching tabs:', matchingTabs.length);

		if (matchingTabs.length === 0) {
			previewDiv.innerHTML = '<p style="color: #666;">No tabs match this pattern</p>';
			previewDiv.style.display = 'block';
			return;
		}

		// Display matching tabs
		var html = '<p><strong>' + matchingTabs.length + ' matching tab(s):</strong></p>';
		html += '<ul style="list-style: none; padding: 0; margin: 5px 0;">';
		matchingTabs.forEach(function(tab) {
			var truncTitle = tab.title.length > 50 ? tab.title.substring(0, 50) + '...' : tab.title;
			html += '<li style="margin: 5px 0; padding: 5px; background: white; border-left: 3px solid #4a86e8;">';
			html += '<strong>' + truncTitle + '</strong><br>';
			html += '<small style="color: #666;">' + tab.url + '</small>';
			html += '</li>';
		});
		html += '</ul>';
		previewDiv.innerHTML = html;
		previewDiv.style.display = 'block';
	});
}

function saveConfiguration(name, regex, color) {
	// Get existing config
	chrome.storage.sync.get("regexes", function(result) {
		var regexes = result.regexes ? result.regexes : [];

		// Check if this pattern already exists (by name)
		var exists = regexes.some(function(item) {
			return item.name === name;
		});

		if (exists) {
			// Update existing pattern
			regexes = regexes.map(function(item) {
				if (item.name === name) {
					return {name: name, regex: regex, color: color};
				}
				return item;
			});
			console.log('Updated existing pattern in config');
		} else {
			// Add new pattern
			regexes.push({name: name, regex: regex, color: color});
			console.log('Added new pattern to config');
		}

		// Save back to storage
		chrome.storage.sync.set({regexes: regexes}, function() {
			console.log('Configuration saved');
		});
	});
}

function createDynamicGroup() {
	var regexStr = document.getElementById('regex').value;
	var groupName = document.getElementById('groupname').value;
	var color = document.getElementById('color').value;
	var statusDiv = document.getElementById('status');

	console.log('Creating group with:', {regexStr, groupName, color});

	// Validate inputs
	if (!regexStr || !groupName) {
		statusDiv.textContent = 'Please provide both a regex pattern and group name';
		statusDiv.className = 'error';
		statusDiv.style.display = 'block';
		return;
	}

	// Validate regex
	try {
		var regex = new RegExp(regexStr);
	} catch(e) {
		statusDiv.textContent = 'Invalid regex: ' + e.message;
		statusDiv.className = 'error';
		statusDiv.style.display = 'block';
		console.error('Regex error:', e);
		return;
	}

	// Query tabs and filter by regex - only from normal windows
	chrome.tabs.query({windowType: 'normal'}, function(tabs) {
		console.log('Querying tabs in normal windows, total:', tabs.length);
		var matchingTabs = [];
		var targetWindowId = null;

		tabs.forEach(function(tab) {
			if (tab.url.match(regex)) {
				matchingTabs.push(tab.id);
				// Store the window ID of the first matching tab
				if (targetWindowId === null) {
					targetWindowId = tab.windowId;
				}
			}
		});

		console.log('Matching tab IDs:', matchingTabs);
		console.log('Target window ID:', targetWindowId);

		if (matchingTabs.length === 0) {
			statusDiv.textContent = 'No tabs match the pattern';
			statusDiv.className = 'error';
			statusDiv.style.display = 'block';
			return;
		}

		// Check if group with this name already exists
		chrome.tabGroups.query({}, function(allGroups) {
			console.log('All existing groups:', allGroups);

			// Filter for groups with matching title in the target window
			var existingGroups = allGroups.filter(function(group) {
				return group.title === groupName && group.windowId === targetWindowId;
			});

			console.log('Existing groups with name in target window:', existingGroups);

			if (existingGroups.length > 0) {
				// Group exists in target window, add tabs to it
				chrome.tabs.group({groupId: existingGroups[0].id, tabIds: matchingTabs}, function() {
					if (chrome.runtime.lastError) {
						console.error('Error grouping tabs:', chrome.runtime.lastError);
						statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
						statusDiv.className = 'error';
						statusDiv.style.display = 'block';
						return;
					}
					console.log('Successfully added to existing group');

					// Check if user wants to save this configuration
					var saveConfig = document.getElementById('save-config').checked;
					if (saveConfig) {
						console.log('Saving configuration...');
						saveConfiguration(groupName, regexStr, color);
					}

					statusDiv.textContent = 'Added ' + matchingTabs.length + ' tab(s) to existing group';
					statusDiv.className = 'success';
					statusDiv.style.display = 'block';
					setTimeout(function() { window.close(); }, 1000);
				});
			} else {
				// Create new group: first group the first tab in its window, then add the rest
				var firstTabId = matchingTabs[0];
				var remainingTabIds = matchingTabs.slice(1);

				console.log('Creating group with first tab:', firstTabId, 'in window:', targetWindowId);

				// Group the first tab to create the group in the target window
				chrome.tabs.group({createProperties: {windowId: targetWindowId}, tabIds: [firstTabId]}, function(groupId) {
					if (chrome.runtime.lastError) {
						console.error('Error creating group:', chrome.runtime.lastError);
						statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
						statusDiv.className = 'error';
						statusDiv.style.display = 'block';
						return;
					}
					console.log('Created group ID:', groupId, 'in window:', targetWindowId);

					// Update the group with title and color
					chrome.tabGroups.update(groupId, {
						title: groupName,
						color: color,
						collapsed: false
					}, function() {
						if (chrome.runtime.lastError) {
							console.error('Error updating group:', chrome.runtime.lastError);
							statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
							statusDiv.className = 'error';
							statusDiv.style.display = 'block';
							return;
						}
						console.log('Successfully updated group');

						// Check if user wants to save this configuration
						var saveConfig = document.getElementById('save-config').checked;
						if (saveConfig) {
							console.log('Saving configuration...');
							saveConfiguration(groupName, regexStr, color);
						}

						// Now add the remaining tabs to the group
						if (remainingTabIds.length > 0) {
							console.log('Adding remaining tabs:', remainingTabIds);
							chrome.tabs.group({groupId: groupId, tabIds: remainingTabIds}, function() {
								if (chrome.runtime.lastError) {
									console.error('Error adding remaining tabs:', chrome.runtime.lastError);
									statusDiv.textContent = 'Error adding all tabs: ' + chrome.runtime.lastError.message;
									statusDiv.className = 'error';
									statusDiv.style.display = 'block';
									return;
								}
								console.log('Successfully added all tabs to group');
								statusDiv.textContent = 'Created group with ' + matchingTabs.length + ' tab(s)';
								statusDiv.className = 'success';
								statusDiv.style.display = 'block';
								setTimeout(function() { window.close(); }, 1000);
							});
						} else {
							// Only one tab, already grouped
							statusDiv.textContent = 'Created group with 1 tab';
							statusDiv.className = 'success';
							statusDiv.style.display = 'block';
							setTimeout(function() { window.close(); }, 1000);
						}
					});
				});
			}
		});
	});
}

document.getElementById('preview').addEventListener('click', previewMatches);
document.getElementById('create').addEventListener('click', createDynamicGroup);
document.getElementById('cancel').addEventListener('click', function() {
	window.close();
});

// Handle Enter key in any input field
document.querySelectorAll('input').forEach(function(input) {
	input.addEventListener('keypress', function(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			createDynamicGroup();
		}
	});
});
