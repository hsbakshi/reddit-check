var selectedTabId = 0;
var selectedURL = "";
var selectedTitle = "";
var redditPosts = new Array();
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

function getYoutubeUnique(url){
    var gotVidId = false;
    var video_id = '';
    var urls = new Array();
    if (url.indexOf('//www.youtube.com') != -1) {
        if (url.indexOf('v=') != -1) {
            var video_id = url.split('v=')[1];
            var ampersandPosition = video_id.indexOf('&');
            if(ampersandPosition != -1) {
                  video_id = video_id.substring(0, ampersandPosition);
                  gotVidId = true;
            }
        }
    }
    urls.push(url);
    if (gotVidId) {
        urls.push('http://www.youtube.com/watch?v='+video_id);
        urls.push('https://www.youtube.com/watch?v='+video_id);
    }
    return urls;
}

// get URL info json
function getURLInfo(url){
    redditPosts = new Array();
    var urls = getYoutubeUnique(url);
    for (var i = 0; i < urls.length; ++i) {
        url = encodeURIComponent(urls[i]);
        var redditUrl = 'http://www.reddit.com/api/info.json?url=' + url;
        $.getJSON(redditUrl, updateBadge);
    }
    
}


function updateBadge(jsonData){
    var orangeRed = [255, 69, 0, 55];
    var green = [1, 220, 1, 255];

    var title = "Repost";
    var badgeColor = green;
    var alienIcon = "images/alien32.png";
    redditPosts = redditPosts.concat(jsonData.data.children);
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


