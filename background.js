var selectedTabId = 0;
var selectedURL = "";
var selectedTitle = "";
var gRedditPosts = null

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

function getYoutubeURLs(url){
    var gotVidId = false;
    var video_id = '';
    var urls = []
    if (url.indexOf('v=') != -1) {
        var video_id = url.split('v=')[1];
        if (video_id != "")
              gotVidId = true;
        var ampersandPosition = video_id.indexOf('&');
        if(ampersandPosition != -1) {
              video_id = video_id.substring(0, ampersandPosition);
        }
    }
    if (gotVidId) {
        var httpUrl = 'http://www.youtube.com/watch?v='+video_id
        if (httpUrl != url) {
            urls.push(httpUrl);
        }
        var httpsUrl = 'https://www.youtube.com/watch?v='+video_id
        if (httpsUrl != url) {
            urls.push(httpsUrl);
        }
    }
    return urls;
}

function constructURLs(url){
    if (url.indexOf('http') == -1) {
        return []
    }
    var urls = [url];
    if (url.indexOf('youtube.com') != -1) {
        urls = urls.concat(getYoutubeURLs(url));
    }
    return urls;
}


// get URL info json
function getURLInfo(url){
    var redditPosts = []
    var urls = constructURLs(url);
    for (var i = 0; i < urls.length; ++i) {
        console.log('url: i',urls[i], i)
        url = encodeURIComponent(urls[i]);
        var redditUrl = 'http://www.reddit.com/api/info.json?url=' + url;
        $.getJSON(redditUrl, function(jsonData) {
            redditPosts = redditPosts.concat(jsonData.data.children)
            updateBadge(redditPosts.length);
            console.log(redditPosts);
            gRedditPosts = redditPosts
        });
    }
}


function updateBadge(numPosts){
    var orangeRed = [255, 69, 0, 55];
    var green = [1, 220, 1, 255];

    var title = "Repost";
    var badgeColor = green;
    var alienIcon = "images/alien32.png";
    if (numPosts == 0) {
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
        "text": numPosts.toString(), 
        "tabId": selectedTabId
    });
    
    chrome.browserAction.setIcon({
        "path": alienIcon,
        "tabId": selectedTabId
    });
}


