var gRedditPosts = null

// update on URL update
chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
    changeAction(tab)
});

// update on selection change
chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
    chrome.tabs.getSelected(null, function(tab){
        changeAction(tab)
    });
});

function changeAction(tab) {
    isBlacklisted(tab, disableBadge, getURLInfo)
}

function isBlacklisted(tab, actionOnTrue, actionOnElse) {
    var url = tab.url
    console.log('in isBlacklisted')
    chrome.storage.sync.get('blacklist', function (storageMap) {
        var isBlocked = false
        if (storageMap.hasOwnProperty('blacklist')){
            var list = storageMap['blacklist']
            console.log(list)
            for (var i=0; i<list.length; ++i) {
                if (url.indexOf(list[i]) > -1) {
                    isBlocked = true
                    break
                }
                console.log('blockurl:'+list[i]+' url:'+url)
            }
        } 
        console.log('in isBlacklisted:'+isBlocked)
        if (isBlocked) {
            actionOnTrue(tab)
        } else {
            actionOnElse(tab)
        }
    });
}

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
    if (url.indexOf('https') != -1) {
        urls = urls.concat(url.replace('https', 'http'));
    }
    return urls;
}


// get URL info json
function getURLInfo(tab){
    var url = tab.url
    console.log('in getURLInfo')
    var redditPosts = []
    var urls = constructURLs(url);
    for (var i = 0; i < urls.length; ++i) {
        console.log('url: i',urls[i], i)
        url = encodeURIComponent(urls[i]);
        var redditUrl = 'http://www.reddit.com/api/info.json?url=' + url;
        $.getJSON(redditUrl, function(jsonData) {
            redditPosts = redditPosts.concat(jsonData.data.children)
            updateBadge(redditPosts.length, tab);
            console.log(redditPosts);
            gRedditPosts = redditPosts
        });
    }
}

function disableBadge(tab){
    var title = "Blacklisted by you"
    var text = "-"
    var badgeColor = [250, 0, 0, 200] //red
    var alienIcon = { '19': "images/alien_apathy19.png", '38': "images/alien_apathy38.png" }
    setBadge(title, text, badgeColor, alienIcon, tab)
}

function updateBadge(numPosts, tab){
    var orangeRed = [255, 69, 0, 55]
    var green = [1, 220, 1, 255]

    var title = "Repost"
    var text = numPosts.toString()
    var badgeColor = green
    var alienIcon = { '19': "images/alien19.png", '38': "images/alien38.png" }
    if (numPosts == 0) {
        badgeColor = orangeRed
        title = "Post link"
        alienIcon = { '19': "images/alien_apathy19.png", '38': "images/alien_apathy38.png" }
    }
    setBadge(title, text, badgeColor, alienIcon, tab)
}

function setBadge(title, text, badgeColor, alienIcon, tab) {
    var tabId = tab.id
    chrome.browserAction.setTitle({"title": title, "tabId": tabId})
    chrome.browserAction.setBadgeBackgroundColor({
        "color": badgeColor, 
        "tabId": tabId
    })
    chrome.browserAction.setBadgeText({
        "text": text,
        "tabId": tabId
    })
    chrome.browserAction.setIcon({
        "path": alienIcon,
        "tabId": tabId
    })
}


