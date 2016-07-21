function openOptionsIfFirstRun() {
  chrome.storage.sync.get(null, function(options) {
    if (!options.firstRunTime) {
      chrome.storage.sync.set({firstRunTime: new Date()});
      chrome.runtime.openOptionsPage();
    }
  });
}

function removeBadge() {
  chrome.browserAction.setBadgeText({text: ''});
}
function setBadge(text) {
  chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
  chrome.browserAction.setBadgeText({text: ''+text});
}
function setTitle(text) {
  chrome.browserAction.setTitle({title: ''+text});
}
function readIcon() {
  chrome.browserAction.setIcon({path: 'img/favicon-read.ico'});
}
function unreadIcon() {
  chrome.browserAction.setIcon({path: 'img/favicon-unread.ico'});
}

function func() {
  chrome.storage.sync.get(null, function(options) {
    if (!options.token) {
      readIcon();
      setBadge('E');
      setTitle('API token not set\nPlease, see the options page');
      return;
    }

    var request = new XMLHttpRequest(),
      unreadCount = 0,
      titles = [];
    request.open('GET', 'https://api.gitter.im/v1/rooms', true);
    request.onload = function() {
      if (this.status < 200 || this.status >= 400) {
        readIcon();
        setBadge('E');
        setTitle('Error: could not connect');
        return;
      }
      var rooms = JSON.parse(this.response);
      var length = rooms.length;
      for (var i = 0; i < length; i++) {
        var room = rooms[i];
        if (room.unreadItems > 0) {
          unreadCount += room.unreadItems;
          if (room.unreadItems == 1) {
            titles.push('1 unread message on '+room.name);
          } else {
            titles.push(room.unreadItems+' unread messages on '+room.name);
          }
        }
      }
      if (unreadCount > 0) {
        setBadge(unreadCount);
        setTitle(titles.join('\n'));
        unreadIcon();
      } else {
        removeBadge();
        setTitle('No unread messages');
        readIcon();
      }
    };
    request.onerror = function() {
      readIcon();
      setBadge('E');
      setTitle('Error: could not connect');
    }
    request.setRequestHeader('Authorization', 'Bearer '+options.token);
    request.send();
  });
}

chrome.browserAction.onClicked.addListener(function(activeTab){
  chrome.tabs.create({url: 'https://gitter.im'});
});

openOptionsIfFirstRun();
func();
chrome.alarms.onAlarm.addListener(func);
chrome.alarms.create('time', {periodInMinutes: 1});
