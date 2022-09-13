// WHY AM I STILL NOT CONFIGURED VIA OPTIONS SCREEN??
var tabRegex = [{name: "Jira", regex: /^http.*\/\/\w*.atlassian.net\/jira.*$/},
                {name: "GDocs", regex: /^http.*\/\/docs.google.com\/document.*$/},
                {name: "GSheets", regex: /^http.*\/\/docs.google.com\/spreadsheets.*$/}];

chrome.commands.onCommand.addListener(function(command) {
  switch(command){
    case "dedupchrome":
      chrome.tabs.query({}, deDuplicateTabs);
      break;
    case "grouptabs":
      chrome.tabs.query({}, createTabGroups);
      break;
    case "dedupwindow":
      console.log("dedupwindow");
      chrome.tabs.query({currentWindow: true}, function (tabs) {
        deDuplicateTabs(tabs);
      });
      break;
    case "dedupthistab":
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        killDupsOfThis(tabs[0]);
      });
      break;
  }
});

// Tab deduplication functions
function killDupsOfThis(activeTab) {
  chrome.tabs.query({active: false, currentWindow: true}, function (tabs) {
    tabs.forEach( function(tab, index) {
      if(tab.url === activeTab.url && tab.active != true) {
            chrome.tabs.remove(tab.id);
      }
    })
  });

}

function deDuplicateTabs(tabs)  {
  var tabDict = {};
  tabs.forEach(function(tab, index) {
      if(tab.url in tabDict) {
        chrome.tabs.remove(tab.id);
      } else {
        tabDict[tab.url] = [tab.id];
      }
  })
}

var autoTab = false;

function createTabGroups(tabs) {
  matchGroup = [];

  tabs.forEach(function(tab, index) {
      if(tab.groupId < 0) {
        tabRegex.every(function(line, tindex) {
          if(tab.url.match(line["regex"])) {
            matchGroup[tindex] ? matchGroup[tindex].push(tab.id) : matchGroup[tindex] = [tab.id];
            return false; // match the first regex then dump out
          }
          return true; // continue
        }); 
    }
  }); 

  matchGroup.forEach(function(id, gindex) {
    chrome.tabGroups.query({title: tabRegex[gindex]["name"]}, function(tabGroup) {
        if(tabGroup.length != 0) {
          // group DOES exist
          chrome.tabs.group({groupId:tabGroup[0].id, tabIds: matchGroup[gindex]});
        } else {
          // group DOES NOT exist
          chrome.tabs.group({tabIds: matchGroup[gindex]}, 
            function(groupId) {
                    tabRegex[gindex]["matchGroup"] = groupId;
                    chrome.tabGroups.update(groupId, {collapsed: true, title: tabRegex[gindex]["name"]});      
            });
        }      
    });
  }); 
       
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.regexes) {
      // the name is the key!  update tabRegex based on name, swapping out the regex if the name is there, 
      // creating a new line if the name isn't there.  If the name isn't in _this_ new batch of regexes, nuke the old one
      // suggestion: create a new tabRegex structure, pulling the data from the old one when the name matches, and then swap
      // old with new.  Then you don't have to remove the old entries.
      sendResponse({status: "Loaded"});
    }
  }
);
