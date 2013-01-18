function loadBlacklist()
{
    console.log('loadBlacklist called.');
    chrome.storage.sync.get('blacklist', function (storageMap) {
        $('div#loading').hide(0);
        if (storageMap.hasOwnProperty('blacklist') ){
            $.each(storageMap['blacklist'], function(index, item) {
                $("#blacklist").append("<li>"+item+"</li>");
            });
        } else {
            $('div#emptynotice').show(0);
        }
    });
}

$('#blockform').submit(function() {
    var url = $('input#blockurl').val();
    console.log(url);
    if (url.length > 0) {
        chrome.storage.sync.get('blacklist', function (storageMap) {
            var blacklist = [];
            if (storageMap.hasOwnProperty('blacklist') ){
                blacklist = storageMap['blacklist'];
            }
            blacklist.push(url);
            saveBlacklist(blacklist);
        });
    } else {
        alert('Empty URL.');
    }
});

function saveBlacklist(blacklist)
{
    chrome.storage.sync.set({'blacklist':blacklist},function(){
        console.log('Blacklist saved');
    });
}
loadBlacklist();
