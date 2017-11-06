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

function backgroundSnoowrap() {
    'use strict';
    var clientId = 'JM8JSElud0Rm1g';
    var redirectUri = chrome.identity.getRedirectURL('provider_cb');
    var redirectRe = new RegExp(redirectUri + '[#\?](.*)');
    // TODO: bogus userAgent
    var userAgent = chrome.runtime.id + ':' + 'v0.0.1' + ' (by /u/sirius_li)'

    var snoowrap_requester_json = lscache.get('snoowrap_requester_json');
    var snoowrap_requester = setSnoowrapFromJson(snoowrap_requester_json);

    function setSnoowrapFromJson(snoo_json) {
        if (snoo_json) {
            return new snoowrap({
                userAgent: snoo_json.userAgent,
                clientId: snoo_json.clientId,
                clientSecret: '',
                refreshToken: snoo_json.refreshToken
            });
        } else {
            return null;
        }
    }

    return {
        // TODO: anonymous login

        logInReddit: function(interactive, callback) {
            // In case we already have a snoowrap requester cached, simply return it.
            if (lscache.get('snoowrap_requester_json')) {
                callback('Success');
                return;
            }

            var authenticationUrl = snoowrap.getAuthUrl({
                clientId: clientId,
                scope: ['identity', 'read', 'submit'],
                redirectUri: redirectUri,
                permanent: true,
                state: 'fe211bebc52eb3da9bef8db6e63104d3' // TODO: bogus state
            });

            var options = {
                'interactive': interactive,
                'url': authenticationUrl
            }
            chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
                if (chrome.runtime.lastError) {
                    new Error(chrome.runtime.lastError);
                }

                var matches = redirectUri.match(redirectRe);
                if (matches && matches.length > 1) {
                    var code = new URL(redirectUri).searchParams.get('code');
                    setSnoowrapFromAuthCode(code);
                } else {
                    new Error('Invalid redirect URI');
                }
            });

            function setSnoowrapFromAuthCode(auth_code) {
                var snoowrap_promise = snoowrap.fromAuthCode({
                    code: auth_code,
                    userAgent: userAgent,
                    clientId: clientId,
                    redirectUri: redirectUri
                });
                snoowrap_promise.then(r => {
                    lscache.set('snoowrap_requester_json', r);
                    snoowrap_requester_json = JSON.stringify(r);
                    snoowrap_requester = r;
                    callback('Success');
                });
            }
        },

        submitPost: function(subreddit, title, url, callback) {
            snoowrap_requester.submitLink({
                subredditName: subreddit,
                title: title,
                url: url
            })
            .then(function(submission) {
                callback('Success');
            })
            .catch(function(err) {
                callback(err);
            });
        },

        getCurrentUserName: function(callback) {
            snoowrap_requester.getMe()
            .then(u => callback(u.name));
        }
    }
}

var snoo = backgroundSnoowrap();

function onRequest(request, sender, callback) {
    console.log(request);
    if (request.action == 'logInReddit') {
        snoo.logInReddit(request.interactive, callback);
        return true;
    } else if (request.action == 'submitPost') {
        snoo.submitPost(request.subreddit, request.title, request.url, callback);
        return true;
    } else if (request.action == 'getCurrentUserName') {
        snoo.getCurrentUserName(callback);
        return true;
    }
}

chrome.runtime.onMessage.addListener(onRequest);
