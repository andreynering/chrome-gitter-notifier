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
function greyIcon() {
  chrome.browserAction.setIcon({path: 'gitter-grey.png'});
}
function coloredIcon() {
  chrome.browserAction.setIcon({path: 'gitter.png'});
}

function func() {
  chrome.storage.sync.get(null, function(options) {
    if (!options.token) {
      greyIcon();
      setBadge('E');
      setTitle('API token not set\nPlease, see the options page');
      return;
    }

    removeBadge();

    var request = new XMLHttpRequest(),
      unreadCount = 0,
      titles = [];
    request.open('GET', 'https://api.gitter.im/v1/rooms', true);
    request.onload = function() {
      if (this.status < 200 || this.status >= 400) {
        greyIcon();
        setBadge('E');
        setTitle('Error: could not connect');
        return;
      }
      var rooms = JSON.parse(this.response);
      var length = rooms.length;
      for (var i = 0; i < length; i++) {
        var room = rooms[i];
        if (room.unreadCount > 0) {
          unreadCount += room.unreadCount;
          titles.push(room.unreadCount+' messages on '+room.name);
        }
      }
      if (unreadCount > 0) {
        setBadge(unreadCount);
        setTitle(titles.join('\n'));
      } else {
        removeBadge();
        setTitle('No unread messages');
      }
      coloredIcon();
    };
    request.onerror = function() {
      greyIcon();
      setBadge('E');
      setTitle('Error: could not connect');
    }
    request.setRequestHeader('Authorization', 'Bearer '+options.token);
    request.send();
  });
}

openOptionsIfFirstRun();
greyIcon();
func();
chrome.alarms.onAlarm.addListener(func);
chrome.alarms.create('time', {periodInMinutes: 1});
