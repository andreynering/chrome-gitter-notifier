var back = chrome.extension.getBackgroundPage();

var form = document.getElementById('form'),
  tokenInput = document.getElementById('token');

chrome.storage.sync.get(null, function(options) {
  if (options.token) {
    tokenInput.value = options.token;
  }
});

form.onsubmit = function(event) {
  event.preventDefault();

  chrome.storage.sync.set({token: tokenInput.value});
  back.updateBadgeCount();
  alert('Options saved!');
}
