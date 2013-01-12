var selectedTabId = 0;
var selectedURL = "";
var selectedTitle = "";
var redditPosts;
var modHash;

function updateGlobal(tab) {
        selectedTabId = tab.id;
        selectedURL = tab.url;
        selectedTitle = tab.title;
}
// update on selection
chrome.tabs.getSelected(null, updateGlobal);

// update on URL update
chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
    if(tab.id === selectedTabId){
            updateGlobal(tab);
            getURLInfo(selectedURL);
    }
});

// update on selection change
chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
        chrome.tabs.getSelected(null, function(tab){
                    updateGlobal(tab);
                    getURLInfo(selectedURL);
        });
});


// get URL info json
function getURLInfo(url){
    url = encodeURIComponent(url);
    var redditUrl = 'http://www.reddit.com/api/info.json?url=' + url;
    $.getJSON(redditUrl, updateBadge);
}


function updateBadge(jsonData){
    var orangeRed = [255, 69, 0, 55];
    var green = [1, 220, 1, 255];

    var title = "Repost";
    var badgeColor = green;
    var alienIcon = "images/alien32.png";
    redditPosts = jsonData.data.children;
    modHash = jsonData.data.modhash;
    if (redditPosts.length == 0) {
        badgeColor = orangeRed;
        title = "Post link";
        alienIcon = "images/alien_apathy32.png";
    }
        
    chrome.browserAction.setTitle({"title": title, "tabId": selectedTabId});

    chrome.browserAction.setBadgeBackgroundColor({
        "color": badgeColor, 
        "tabId": selectedTabId
    });
    
    chrome.browserAction.setBadgeText({
        "text": redditPosts.length.toString(), 
        "tabId": selectedTabId
    });
    
    chrome.browserAction.setIcon({
        "path": alienIcon,
        "tabId": selectedTabId
    });
}


