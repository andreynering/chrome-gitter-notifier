function openOptionsIfFirstRun() {
  chrome.storage.sync.get(null, function(options) {
    if (!options.firstRunTime) {
      chrome.storage.sync.set({firstRunTime: new Date()});
      chrome.runtime.openOptionsPage();
    }
  });
}

var COLOR_GREEN = '#33cc33',
  COLOR_ORANGE = '#ff6600',
  COLOR_RED = '#ff0000';

function removeBadge() {
  chrome.browserAction.setBadgeText({text: ''});
}
function setBadge(text, color) {
  chrome.browserAction.setBadgeBackgroundColor({color: color});
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
      setBadge('E', COLOR_RED);
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

    fetch('https://api.gitter.im/v1/rooms', {
      headers: {
        'Authorization': 'Bearer '+options.token
      }
    }).
      then(function(response) {
        return response.json();
      }).then(function(rooms) {
        var unreadCount = 0,
          mentionCount = 0,
          titles = [];

        for (var i = 0; i < rooms.length; i++) {
          var room = rooms[i];

          mentionCount += room.mentions;
          unreadCount += room.unreadItems;

          if (room.unreadItems == 1) {
            titles.push('1 unread message on '+room.name);
          } else if (room.unreadItems > 1) {
            titles.push(room.unreadItems+' unread messages on '+room.name);
          }
        }

        if (mentionCount > 0) {
          setBadge('@', COLOR_ORANGE);
          setTitle(titles.join('\n'));
          unreadIcon();
        } else if (unreadCount > 0) {
          setBadge(unreadCount, COLOR_GREEN);
          setTitle(titles.join('\n'));
          unreadIcon();
        } else {
          removeBadge();
          setTitle('No unread messages');
          readIcon();
        }
      }).
      catch(function(err) {
        readIcon();
        setBadge('E', COLOR_RED);
        setTitle('Error: could not connect');
      });
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
