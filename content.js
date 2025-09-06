(function () {
  'use strict';

  let adBlockerEnabled = true;
  let adsBlocked = 0;
  let sessionBlocks = 0;

  // Load saved settings
  chrome.storage.sync.get(['adBlockerEnabled', 'adsBlocked', 'sessionBlocks'], function (data) {
    adBlockerEnabled = data.adBlockerEnabled !== undefined ? data.adBlockerEnabled : true;
    adsBlocked = data.adsBlocked || 0;
    sessionBlocks = data.sessionBlocks || 0;
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.type === 'TOGGLE_ADBLOCK') {
      adBlockerEnabled = request.enabled;
      if (adBlockerEnabled) {
        injectAdBlockCSS();
        blockAds();
      } else {
        // Remove injected CSS when disabled
        const injectedCSS = document.getElementById('youtube-adblock-css');
        if (injectedCSS) {
          injectedCSS.remove();
        }
      }
    }
  });

  // Function to block ads
  function blockAds() {
    if (!adBlockerEnabled) return;

    let adsRemoved = 0;

    // Skip ad buttons - click them immediately
    const skipButtons = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
    skipButtons.forEach(button => {
      if (button.offsetParent !== null) { // Check if visible
        button.click();
        adsRemoved++;
      }
    });

    // Video ad overlays and containers
    const videoAdSelectors = [
      '.video-ads',
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '.ytp-ad-player-overlay',
      '.ytp-ad-image-overlay',
      '.ad-container',
      '.ytp-ad-preview-container'
    ];

    videoAdSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        ad.remove();
        adsRemoved++;
      });
    });

    // Homepage and sidebar ads
    const homepageAdSelectors = [
      'ytd-ad-slot-renderer',
      'ytd-banner-promo-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-promoted-video-renderer',
      'ytd-compact-promoted-video-renderer',
      'ytd-display-ad-renderer',
      'ytd-promoted-sparkles-text-search-renderer',
      '[data-ad-slot-id]',
      '.ytd-promoted-sparkles-web-renderer',
      '.ytd-in-feed-ad-layout-renderer'
    ];

    homepageAdSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        ad.remove();
        adsRemoved++;
      });
    });

    // Masthead ads (top banner)
    const mastheadAds = document.querySelectorAll('ytd-rich-section-renderer[is-masthead-ad], #masthead-ad');
    mastheadAds.forEach(ad => {
      ad.remove();
      adsRemoved++;
    });

    // Shorts ads
    const shortsAds = document.querySelectorAll('ytd-reel-video-renderer[is-ad], ytd-ad-slot-renderer[is-shorts-ad]');
    shortsAds.forEach(ad => {
      ad.remove();
      adsRemoved++;
    });

    // Remove ads by checking for ad indicators in text content
    const potentialAds = document.querySelectorAll('[aria-label*="Ad"], [title*="Ad"], [data-ad], .ad, [class*="ad-"], [id*="ad-"]');
    potentialAds.forEach(element => {
      const text = element.textContent.toLowerCase();
      const hasAdIndicator = text.includes('ad ·') || text.includes('sponsored') ||
        element.querySelector('.ytd-badge-supported-renderer') ||
        element.getAttribute('aria-label')?.toLowerCase().includes('ad');

      if (hasAdIndicator && element.closest('ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer')) {
        element.closest('ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer').remove();
        adsRemoved++;
      }
    });

    // Speed up video if ad is playing (fallback)
    const video = document.querySelector('video');
    if (video && document.querySelector('.ytp-ad-player-overlay-layout')) {
      video.playbackRate = 16;
      video.muted = true;
    }

    if (adsRemoved > 0) {
      adsBlocked += adsRemoved;
      sessionBlocks += adsRemoved;
      chrome.storage.sync.set({
        adsBlocked: adsBlocked,
        sessionBlocks: sessionBlocks
      });
    }
  }

  // Add CSS to hide ads that might slip through
  function injectAdBlockCSS() {
    if (document.getElementById('youtube-adblock-css')) return;

    const style = document.createElement('style');
    style.id = 'youtube-adblock-css';
    style.textContent = `
      /* Hide video ads */
      .video-ads, .ytp-ad-module, .ytp-ad-overlay-container,
      .ytp-ad-text-overlay, .ytp-ad-player-overlay, .ytp-ad-image-overlay,
      .ad-container, .ytp-ad-preview-container { display: none !important; }
      
      /* Hide homepage ads */
      ytd-ad-slot-renderer, ytd-banner-promo-renderer, ytd-promoted-sparkles-web-renderer,
      ytd-promoted-video-renderer, ytd-compact-promoted-video-renderer,
      ytd-display-ad-renderer, ytd-promoted-sparkles-text-search-renderer,
      [data-ad-slot-id], .ytd-promoted-sparkles-web-renderer,
      .ytd-in-feed-ad-layout-renderer { display: none !important; }
      
      /* Hide masthead ads */
      ytd-rich-section-renderer[is-masthead-ad], #masthead-ad { display: none !important; }
      
      /* Hide shorts ads */
      ytd-reel-video-renderer[is-ad], ytd-ad-slot-renderer[is-shorts-ad] { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  // Run initially
  injectAdBlockCSS();
  blockAds();

  // Set up MutationObserver to detect dynamically loaded ads
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length) {
        blockAds();
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also check periodically (more frequently for better ad blocking)
  setInterval(blockAds, 500);

  // Handle page navigation (YouTube is a SPA)
  let currentUrl = location.href;
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(() => {
        injectAdBlockCSS();
        blockAds();
      }, 1000);
    }
  }, 1000);
})();