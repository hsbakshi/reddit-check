function interactSnoowrap() {
    var snoo_json;
    var snoowrap_requester;
    var reddit_user;

    function setSnoowrap(snoo_json) {
        snoowrap_requester = new snoowrap({
            userAgent: snoo_json.userAgent,
            clientId: snoo_json.clientId,
            clientSecret: '',
            refreshToken: snoo_json.refreshToken
        });
        snoowrap_requester.getMe().then(u => {
            reddit_user = u;
            console.log(u);
        });
        return;
    }

    function submitPost() {
        snoowrap_requester.submitLink({
            subredditName: getSubreddit(),
            title: $("#comment").val(),
            url: $("#newpostURL").val()
        })
        .then(function(submission) {
            $("#form").hide(0);
            $("#status").append("<span>Successful post</span>")
        })
        .catch(function(err) {
            $("#form").hide(0);
            $("#back").attr("href", "post.html")
            $("#status").append("<span>" + err + "</span>");
        });
    }

    function showSubmitForm() {
        $("#login").hide(0);
        $("#form").show(0);
        $("#submitPost").click(submitPost);
    }

    function getSubreddit() {
        // Default behavior is to post to user profile
        var subreddit = $("#subreddit").val();
        if (subreddit) {
            return subreddit;
        } else {
            return 'u_' + reddit_user.name;
        }
    }

    return {
        isLoggedIn: function (callback) {
            snoo_json = lscache.get('snoowrap_requester_json');
            if (snoo_json) {
                setSnoowrap(snoo_json);
                showSubmitForm();
            } else {
                callback();
            }
        },

        getSnoowrap: function (callback) {
            chrome.runtime.sendMessage({
                'action' : 'getSnoowrap',
                'interactive' : true
            }, callback)
        }
    }
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
            // var title = tab.title;
            // $("#comment").attr("value", title);
        }
    );
}

$(document).ready(function(){
    var snoo = interactSnoowrap();

    $("#close").click(function() {
      window.close();
    });

    snoo.isLoggedIn(
        function() {
            $("#form").hide(0);
            $("#login button").click(function() {
                snoo.getSnoowrap(function(snoo_json) {
                    console.log(snoo_json);
                    snoo.isLoggedIn(function() {
                        $("#status").append("<span>Problem logging in. Try again.</span>");
                    })
                });
            });
        }
    );

    setSubmitFormValues();
});
