// Background service worker
chrome.runtime.onInstalled.addListener(function() {
  // Initialize storage with default values
  chrome.storage.sync.set({ 
    adBlockerEnabled: true, 
    adsBlocked: 0,
    sessionBlocks: 0 
  });
  
  // Create context menu item
  try {
    chrome.contextMenus.create({
      id: "toggle-youtube-adblock",
      title: "Toggle YouTube Ad Blocking",
      contexts: ["action"]
    });
  } catch (error) {
    console.log('Context menu creation failed:', error);
  }
});

// Handle context menu clicks
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "toggle-youtube-adblock") {
      chrome.storage.sync.get(['adBlockerEnabled'], function(data) {
        const newState = !data.adBlockerEnabled;
        chrome.storage.sync.set({ adBlockerEnabled: newState });
        
        // Send message to content script in active YouTube tab
        chrome.tabs.query({url: "https://*.youtube.com/*"}, function(tabs) {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'TOGGLE_ADBLOCK',
                enabled: newState
              }).catch(() => {
                // Ignore errors for tabs that don't have the content script
              });
            }
          });
        });
      });
    }
  });
}