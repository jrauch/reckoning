// reckoning - tab bundling by regex.

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
    case "popit":
      chrome.windows.create({type: 'popup',
                            url: '../pages/popup.html',
                            width: 250,
                            height: 100});
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

function killByRegex(tabs, regex) {
  tabs.forEach(function(tab, index) {
      if(tab.url.match(regex)) {
        chrome.tabs.remove(tab.id);
      }
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
    regexes?result.regexes:[];

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

// look for onActivated events, and mark a given tab as last access _now_

