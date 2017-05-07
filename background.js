var gUrlToAsyncMap = {}
var DEDUPE_KEY = "Dedupe:"
var POST_STORAGE_KEY = "Posts:"

// update on URL update
chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
    console.log('onUpdated: ' + tabId)
    changeAction(tab)
});

// update on selection change
chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
    console.log('onSelectionChanged: ' + tabId)
    chrome.tabs.getSelected(null, function(tab){
        changeAction(tab)
    });
});

function changeAction(tab) {
    if (lscache.get(DEDUPE_KEY + tab.url + tab.id) != null) {
        return // dupe
    }
    lscache.set(DEDUPE_KEY + tab.url + tab.id, "", 2)
    isBlacklisted(tab, disableBadge, getURLInfo)
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
        var prefixes = [
            'http://www.youtube.com/watch?v=',
            'https://www.youtube.com/watch?v=',
            'http://www.youtu.be/',
            'https://www.youtu.be/'
        ];
        prefixes.forEach(function(prefix) {
			if (prefix + video_id != url)
				urls.push(prefix + video_id);
		});
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
    if (url.startsWith('https')) {
        urls = urls.concat(url.replace('https', 'http'));
    }
    return urls;
}


// get URL info json
function getURLInfo(tab){
    var url = tab.url
    var posts = lscache.get(POST_STORAGE_KEY + url)
    if (posts != null) {
        console.log('cached.')
        updateBadge(posts.length, tab);
        return;
    } else {
        console.log('getURLInfo: calling reddit API')
        gUrlToAsyncMap[url] = getPostsForUrl(url)
        var redditPosts = []
        Promise.all(gUrlToAsyncMap[url]).then(values => {
            values.forEach(function(jsonData) { 
                redditPosts = redditPosts.concat(jsonData.data.children)
                updateBadge(redditPosts.length, tab);
                lscache.set(POST_STORAGE_KEY + url, redditPosts, 5)
            });
        });
    }
}

function getPostsForUrl(url) {
    var redditPosts = []
    var promises = []
    var urls = constructURLs(url);
    console.log("checking " + urls.length)
    for (var i = 0; i < urls.length; ++i) {
        let queryUrl = encodeURIComponent(urls[i]);
        var redditUrl = 'https://www.reddit.com/api/info.json?url=' + queryUrl;
        var promise = Promise.resolve($.getJSON(redditUrl));
        promises.push(promise)
    }
    return promises
}

function disableBadge(tab){
    var title = "Blacklisted by you"
    var text = "-"
    var badgeColor = [175, 0, 0, 200] //red
    var alienIcon = { '19': "images/alien_apathy19.png", '38': "images/alien_apathy38.png" }
    setBadge(title, text, badgeColor, alienIcon, tab)
}

function updateBadge(numPosts, tab) {
    var noPostsColor = [175, 0, 0, 55]
    var green = [1, 175, 1, 255]

    var title = "Repost"
    var text = numPosts.toString()
    var badgeColor = green
    var alienIcon = { '19': "images/alien19.png", '38': "images/alien38.png" }
    if (numPosts == 0) {
        badgeColor = noPostsColor
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


