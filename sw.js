// WHY AM I STILL NOT CONFIGURED VIA OPTIONS SCREEN??
var tabRegex = [{name: "Jira", regex: "^http.*//\w*.atlassian.net/jira.*$", color: "red"},
                {name: "GDocs", regex: "^http.*//docs.google.com/document.*$", color: "blue"},
                {name: "GSheets", regex: "^http.*//docs.google.com/spreadsheets.*$", color: "green"}];

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
  });
}

// create onUpdated handler, auto-run createTabGroups if the event contains a new url
// this is a little aggressive, and then begs the q of what to do when a url no longer
// matches the old pattern.  Plan: do nothing.  
// I don't see using this feature.
var autoTab = false;  

function createTabGroups(tabs) {
  matchGroup = [];

  var regexes;
  chrome.storage.sync.get("regexes", function(result) {
    regexes = result.regexes;
    regexes?result.regexes:tabRegex;

    tabs.forEach(function(tab, index) {
        if(tab.groupId < 0) {
          regexes.every(function(line, tindex) {
            if(tab.url.match(line["regex"])) {
              matchGroup[tindex] ? matchGroup[tindex].push(tab.id) : matchGroup[tindex] = [tab.id];
              return false; // match the first regex then dump out
            }
            return true; // continue
          }); 
      }
    }); 

    matchGroup.forEach(function(id, gindex) {
      chrome.tabGroups.query({title: regexes[gindex]["name"]}, function(tabGroup) {
          if(tabGroup.length != 0) {
            // group DOES exist
            chrome.tabs.group({groupId:tabGroup[0].id, tabIds: matchGroup[gindex]});
          } else {
            // group DOES NOT exist
            chrome.tabs.group({tabIds: matchGroup[gindex]}, 
              function(groupId) {
                      regexes[gindex]["matchGroup"] = groupId;
                      chrome.tabGroups.update(groupId, 
                                              {collapsed: true, 
                                               title: regexes[gindex]["name"], 
                                               color: regexes[gindex]["color"]});      
              });
          }      
      });
    });       
  });
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.regexes) {
      // the tabRegex is now stateless - I dont think this is needed.
      sendResponse({status: "Loaded"});
    }
  }
);

// look for onActivated events, and mark a given tab as last access _now_

// look for onCreated, add to the list of tabs, and mark last access _now_

// 
