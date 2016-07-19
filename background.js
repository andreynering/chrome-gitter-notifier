var ba = chrome.browserAction;

function setAllRead() {
  ba.setBadgeText({text: ''});
}

function setUnread(unreadItemCount) {
  ba.setBadgeBackgroundColor({color: [255, 0, 0, 128]});
  ba.setBadgeText({text: '' + unreadItemCount});
}

function func() {
  setUnread(new Date().getMinutes());
}

chrome.alarms.onAlarm.addListener(func);
chrome.alarms.create('time', {alarmInfo: {periodInMinutes: 1}});
func();
