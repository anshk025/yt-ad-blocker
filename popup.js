document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const adsBlockedElement = document.getElementById('adsBlocked');
  const timeSavedElement = document.getElementById('timeSaved');
  const sessionBlocksElement = document.getElementById('sessionBlocks');
  
  // Load saved settings
  chrome.storage.sync.get(['adBlockerEnabled', 'adsBlocked', 'sessionBlocks'], function(data) {
    const isEnabled = data.adBlockerEnabled !== undefined ? data.adBlockerEnabled : true;
    toggleSwitch.checked = isEnabled;
    updateStatusDisplay(isEnabled);
    
    const adsBlocked = data.adsBlocked || 0;
    const sessionBlocks = data.sessionBlocks || 0;
    adsBlockedElement.textContent = adsBlocked;
    timeSavedElement.textContent = Math.round(adsBlocked * 0.5); // Assuming 30s average ad
    sessionBlocksElement.textContent = sessionBlocks;
  });
  
  // Toggle ad blocker
  toggleSwitch.addEventListener('change', function() {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ adBlockerEnabled: isEnabled });
    updateStatusDisplay(isEnabled);
    
    // Send message to content script to update its behavior
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'TOGGLE_ADBLOCK', 
          enabled: isEnabled 
        });
      }
    });
  });
  
  function updateStatusDisplay(isEnabled) {
    statusText.textContent = isEnabled ? 'Active' : 'Inactive';
    statusIndicator.className = isEnabled ? 'status-indicator status-active' : 'status-indicator status-inactive';
  }
  
  // Update stats in real-time
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.adsBlocked) {
      adsBlockedElement.textContent = changes.adsBlocked.newValue;
      timeSavedElement.textContent = Math.round(changes.adsBlocked.newValue * 0.5);
    }
    if (changes.sessionBlocks) {
      sessionBlocksElement.textContent = changes.sessionBlocks.newValue;
    }
  });
});