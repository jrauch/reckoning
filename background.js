var tabRegex = [{name: "Jira", regex: /^http.*\/\/\w*.atlassian.net\/jira.*$/, matchGroup: -1},
                {name: "GDocs", regex: /^http.*\/\/docs.google.com\/document.*$/,matchGroup: -1},
                {name: "GSheets", regex: /^http.*\/\/docs.google.com\/spreadsheets.*$/,matchGroup: -1}];

chrome.tabs.onActivated.addListener(function(activeInfo) {
    if(ringFlag) {
      console.log(activeInfo.tabId);
    }
});

chrome.tabs.onUpdated.addListener(function(activeInfo) {
    if(autoTab) {
      chrome.tabs.query({}, createTabGroups);
    }
});


chrome.tabs.onRemoved.addListener(function(number, removedInfo) {
      while((index = tabRing.indexOf(number)) > -1) {
        tabRing.splice(index, 1);
        console.log("hit");
      }

      while((index = bookmarks.indexOf(number)) > -1) {
        bookmarks.splice(index, 1);
      }
});

chrome.tabGroups.onRemoved.addListener(function(groupId) {
  tabRegex.forEach(function(line, index){
    if(line["matchGroup"] === groupId.id) {
      tabRegex[index]["matchGroup"] = -1;
    }
  });
  console.log(tabRegex);
}
)

chrome.commands.onCommand.addListener(function(command) {
  switch(command){
    case "dumpbookmarks":
      dumpBookmarks();
      break;
    case "togglering":
      if(!ringFlag) {

      } 
      ringFlag = !ringFlag;
      break;
    case "ringnext":
      break;
    case "ringprevious":
      break;
    case command.match(/store-/)?.input:
      index = command.split('-')[1];
      console.log("Store tab in slot "+index);
      bookmarkTab(index);
      break;
    case command.match(/goto-/)?.input:
      index = command.split('-')[1];
      console.log("Goto tab in slot "+index);
      gotoBookmarkTab(index);
      break;
    case "dedupchrome":
      chrome.tabs.query({}, DeduplicateTabs);
      break;
    case "grouptabs":
      chrome.tabs.query({}, createTabGroups);
      break;
    case "dedupwindow":
      console.log("dedupwindow");
      chrome.tabs.query({currentWindow: true}, function (tabs) {
        DeduplicateTabs(tabs);
      });
      break;
    case "dedupthistab":
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        killDupsOfThis(tabs[0]);
      });
      break;
  }
});

function notify(title, message) {
  var opt = {
    type: "basic",
    title: title,
    message: message,
    iconUrl: "save.png"
  };
  var cancel = function(id) {
    setTimeout(function() {
      chrome.notifications.clear(id)
    }, 3000);
  };
  chrome.notifications.create("Reckoning", 
                              {
                                type: "basic", 
                                title: title, 
                                message: message, 
                                iconUrl: "reckon.png"
                              }, 
                              cancel);
}


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

function DeduplicateTabs(tabs)  {
  var tabDict = {};
  tabs.forEach(function(tab, index) {
      if(tab.url in tabDict) {
        chrome.tabs.remove(tab.id);
      } else {
        tabDict[tab.url] = [tab.id];
      }
  })
}

var stack = [];
var ringFlag = false;
var autoTab = false;
var tabRing = [16];

var bookmarks = [];

// Tab bookmarking functions
function dumpBookmarks() {
  console.log(bookmarks);
  var bookmarkstring = "";
  bookmarks.forEach(function(value, index) {
    bookmarkstring += index+": "+value+"\n";
  });
  // ok for each element of the bookmarks list, print the index and the _current_ title of the tab
  notify("Bookmarks", bookmarkstring);
}

function bookmarkTab(index) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    bookmarks[index] = tabs[0].id;
  })
}

function gotoBookmarkTab(index) {
  if(bookmarks[index])
    chrome.tabs.update(bookmarks[index], {active: true});
}

// Tab grouping functions

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
          if(tabRegex[gindex]["matchGroup"] != -1) {
            chrome.tabs.group({groupId:tabRegex[gindex]["matchGroup"], tabIds: matchGroup[gindex]});
          } else {
                chrome.tabs.group({tabIds: matchGroup[gindex]}, 
                  function(groupId) {
                  tabRegex[gindex]["matchGroup"] = groupId;
                  chrome.tabGroups.update(groupId, {collapsed: true, title: tabRegex[gindex]["name"]});
                  
              });
          } 
        });
}


// Tab ring history functions
function addToRing(){
  // when you add to a ring, you store its tab.id, not its url
}

function navigateRing(incr) {
  // go to the next _or_ previous, depending on positive or negative
}
