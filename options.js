var form = document.getElementById('form'),
  tokenInput = document.getElementById('token');

chrome.browserAction.onClicked.addListener(function(activeTab) {
  chrome.tabs.create({url: 'https://gitter.im'});
});

chrome.storage.sync.get(null, function(options) {
  if (options.token) {
    tokenInput.value = options.token;
  }
});

form.onsubmit = function(event) {
  event.preventDefault();

  chrome.storage.sync.set({token: tokenInput.value});
  alert('Options saved!');
}
