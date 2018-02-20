function getCurrentUserName(callback) {
    chrome.runtime.sendMessage({
        'action' : 'getCurrentUserName'
    }, callback)
}

function submitPost(callback) {
    var request = {
        'action' : 'submitPost',
        'subreddit': $("#subreddit").val(),
        'title': $("#comment").val(),
        'url': $("#newpostURL").val()
    };
    if (request.subreddit) {
        chrome.runtime.sendMessage(request, callback);
    } else {
        // Post to User's profile
        getCurrentUserName(function(user_name) {
            request.subreddit = 'u_' + user_name;
            chrome.runtime.sendMessage(request, callback);
        });
    }
}

function showSubmitForm() {
    $("#login").hide(0);
    $("#form").show(0);
    $("form").submit(function(event) {
        event.preventDefault();
        submitPost(function (status) {
            if (status == 'Success') {
                $("#form").hide(0);
                $("#status").append("<span>Successful post</span>")
            } else {
                $("#form").hide(0);
                $("#back").attr("href", "post.html")
                $("#status").append("<span>" + status + "</span>");
            }
        });
    });
}

function isLoggedIn(callback) {
    snoo_json = lscache.get('snoowrap_requester_json');
    if (snoo_json) {
        showSubmitForm();
    } else {
        callback();
    }
}

function logInReddit(callback) {
    chrome.runtime.sendMessage({
        'action' : 'logInReddit',
        'interactive' : true
    }, callback)
}

function searchSubreddits(request, response) {
    chrome.runtime.sendMessage({
        'action': 'searchSubreddits',
        'query': request.term
    }, function(subreddits) {
        var subreddit_urls = [];
        $.each(subreddits, function(i, item) {
            subreddit_urls.push(item.url);
        });
        response(subreddit_urls);
    });
}

function setSubmitFormValues() {
    chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            var tab = tabs[0];
            var url = tab.url;
            console.assert(typeof url == 'string', 'tab.url should be a string');
            $("#newpostURL").attr("value", url);
            Materialize.updateTextFields()
            // var title = tab.title;
            // $("#comment").attr("value", title);
        }
    );
}

function autocompleteSubreddit() {
    $("#subreddit").autocomplete({
        source: searchSubreddits,
        minLength: 3
    });
}

$(document).ready(function(){
    $("#close").click(function() {
      window.close();
    });

    isLoggedIn(
        function() {
            $("#form").hide(0);
            $("#login button").click(function() {
                logInReddit(function(status) {
                    console.log('Login status: ' + status);
                    isLoggedIn(function() {
                        $("#status").append("<span>Problem logging in. Try again.</span>");
                    })
                });
            });
        }
    );

    setSubmitFormValues();
    autocompleteSubreddit();
});
