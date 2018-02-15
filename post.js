function getCurrentUserName(callback) {
    chrome.runtime.sendMessage({
        'action' : 'getCurrentUserName'
    }, callback)
}

function validateForm() {
    
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

$(document).ready(function(){
    $("#close").click(function() {
      window.close();
    });
    // Get Materialize dropdown menus to show up
    // https://stackoverflow.com/a/28258167
    $('select').material_select();

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
});
