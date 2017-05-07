function isBlacklisted(tab, actionOnTrue, actionOnElse) {
    var url = tab.url
    chrome.storage.sync.get('blacklist', function (storageMap) {
        var isBlocked = false
        if (storageMap.hasOwnProperty('blacklist')){
            var list = storageMap['blacklist']
            for (var i=0; i<list.length; ++i) {
                if (url.indexOf(list[i]) > -1) {
                    isBlocked = true
                    break
                }
            }
        } 
        if (isBlocked) {
            actionOnTrue(tab)
        } else {
            actionOnElse(tab)
        }
    });
}
