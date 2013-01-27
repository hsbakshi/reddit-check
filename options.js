
var gBlacklist = null

function getblockurl(index, item) {
    var id = 'blockurl_'+index
    var dellink = "del_"+index
    var divstr = '<div class="blockurl">'+
        '<span class="urlstr">'+item+'</span>'+
        '<span class="delete">'+
            '<a href="#" class="dellink" id="'+dellink+'">Delete</a>'+
        '</span></div>'
    return divstr
}

$('body').on('click', 'a.dellink', function() {
    var id=$(this).attr('id')
    var numId=id.split('_')[1]
    numId = +numId
    var url = gBlacklist[numId]
    gBlacklist.splice(numId, 1)
    saveBlacklist(gBlacklist, "Removed '"+url+"' from blacklist.")
    return false
});

function loadBlacklist()
{
    console.log('loadBlacklist called.');
    $('#blacklist').text('');
    chrome.storage.sync.get('blacklist', function (storageMap) {
        $('div#loading').hide(0);
        if (storageMap.hasOwnProperty('blacklist') ){
            gBlacklist = storageMap['blacklist']
            $.each(storageMap['blacklist'], function(index, item) {
                $("#blacklist").append(getblockurl(index, item))
            });

            if (storageMap['blacklist'].length == 0) {
                $('div#emptynotice').show(0);
            } else {
                $('div#emptynotice').hide(0);
            }
        } else {
            $('div#emptynotice').show(0);
        }
    });
}

$('#blockform').submit(function() {
    var url = $('input#blockurl').val();
    console.log(url);
    if (url.length > 0) {
        $('input#blockurl').val('');
        chrome.storage.sync.get('blacklist', function (storageMap) {
            var blacklist = [];
            if (storageMap.hasOwnProperty('blacklist') ){
                blacklist = storageMap['blacklist'];
            }
            blacklist.push(url);
            saveBlacklist(blacklist, 'Added \''+url+'\' to blacklist.');
        });
    } else {
        alert('Empty URL.')
    }
    return false
});

function setStatus(text) {
    $('#statusarea').text(text);
}


$('#clear').click(function() {
    saveBlacklist([],'Blacklist cleared.');
});

function saveBlacklist(blacklist, message)
{
    gBlacklist=blacklist
    chrome.storage.sync.set({'blacklist':blacklist},function(){
        setStatus(message);
        loadBlacklist();
    });
}
loadBlacklist();
