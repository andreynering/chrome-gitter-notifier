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

function updateBadgeCount() {
  updateMenus();

  chrome.storage.sync.get(null, function(options) {
    if (!options.token) {
      readIcon();
      setBadge('E');
      setTitle('API token not set\nPlease, see the options page');
      return;
    }

    if (isDoNotDisturb(options.doNotDisturb)) {
      readIcon();
      removeBadge();
      var remainingMinutes = moment.unix(options.doNotDisturb).diff(moment(), 'minutes');
      setTitle('You will not be disturbed by ' + remainingMinutes + ' minutes');
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
};

function isDoNotDisturb(doNotDisturbTillUnix) {
  var doNotDisturbTill = moment.unix(doNotDisturbTillUnix);
  return moment().isBefore(doNotDisturbTill);
}

function doNotDisturb(hours) {
  var doNotDisturbTill = moment().add(hours, 'hours');

  chrome.storage.sync.set({doNotDisturb: doNotDisturbTill.unix()}, function() {
    updateBadgeCount();
  });
}

function disableDoNotDisturb() {
  chrome.storage.sync.set({doNotDisturb: null}, function() {
    updateBadgeCount();
  });
}

chrome.browserAction.onClicked.addListener(function(activeTab){
  chrome.tabs.create({url: 'https://gitter.im'});
});

function updateMenus() {
  chrome.storage.sync.get(function(options) {
    chrome.contextMenus.removeAll();

    addMenu('Update', function() { updateBadgeCount(); });
    addMenu('Donate', function() { chrome.tabs.create({url: 'http://goo.gl/kqYe4L'}); });

    if (isDoNotDisturb(options.doNotDisturb)) {
      addMenu('Disable do not disturb', function() { disableDoNotDisturb(); });
    } else {
      addMenu('Do not disturb: 1 hour',  function() { doNotDisturb(1); });
      addMenu('Do not disturb: 2 hours', function() { doNotDisturb(2); });
      addMenu('Do not disturb: 4 hours', function() { doNotDisturb(4); });
      addMenu('Do not disturb: 8 hours', function() { doNotDisturb(8); });
    }
  });
}

function addMenu(title, action) {
  chrome.contextMenus.create({
    title: title,
    contexts: ['browser_action'],
    onclick: action
  });
}

openOptionsIfFirstRun();
updateBadgeCount();
chrome.alarms.onAlarm.addListener(updateBadgeCount);
chrome.alarms.create('time', {periodInMinutes: 1});
