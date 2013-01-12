// parse json data
function parsePosts(globalPage) {
    //var tabId = chrome.extension.getBackgroundPage().selectedTabId;
    var url=globalPage.selectedURL;
    var title=globalPage.selectedTitle;
    var redditPosts = globalPage.redditPosts;
    url = encodeURIComponent(url);
    var submitUrl = "http://www.reddit.com/submit?url=" + url;
    var resubmitUrl = "http://www.reddit.com/submit?resubmit=true&url=" + url;
    var info;
    var permalinks = [];
    var now = new Date();
    var date_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), 
        now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()); 
    var date_entry; 
    var one_day = 86400000; // milliseconds per day

    $("div#timeout").hide(0);
    if (redditPosts.length === 0) {
        chrome.tabs.create({
                url: submitUrl
        });
        window.close();
    }
    for( var i=0; entry = redditPosts[i]; i++) {
            date_entry = new Date(entry.data.created_utc*1000).getTime();
            permalinks[i] = {
                link: entry.data.permalink,
                title: entry.data.title,
                score: entry.data.score+"",
                age: (date_now-date_entry)/one_day,
                comments: entry.data.num_comments+"",
                subreddit: entry.data.subreddit,
            };
    }

    // showPosts:
    var maxTitleLength = 30;
    if (title.length > maxTitleLength)
        title = title.substring (0, maxTitleLength) + "...";
    $("#data").append("<span id='title'>"+title+"</span>&nbsp;&nbsp;&nbsp;");
    
    $("#data").append("<span><a title='Post to reddit'"+
        " target='_blank' href='" + resubmitUrl + 
        "'>Repost</a></span>");
    
    //var arrowUp = "<div class=\"arrow up\" onclick=\"$(this).vote('" + modhash +
    // "', null, event)\"></div>"
    $.each(permalinks, function(index, permalink) {
        $("#links").append(
            "<li>"+ 
            "<div class='score'>"+permalink.score+"</div>"+
            " <a href='http://www.reddit.com" + permalink.link + 
              "' title='" + permalink.link + "' target='_blank' >"+
              permalink.title + "</a>"+
            "<div class='age'>" + getAge(permalink.age)+ 
             " ,&nbsp;&nbsp;" + permalink.comments + " comments,"+
             "&nbsp;&nbsp;r/" + permalink.subreddit +
            "</div>"+
            "</li>"
        );
    });

}

function getAge (days) {
    var age = days.toFixed(1) + " days ago";
    return age;
}
       
document.addEventListener('DOMContentLoaded',function () {
    $("#close").click(function() {
      window.close();
    });
});

chrome.runtime.getBackgroundPage(function (global){parsePosts(global)});
   // showPosts();
//});
//url="http://news.ycombinator.com";


