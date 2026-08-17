(function () {
  'use strict';

  let adBlockerEnabled = true;
  let adsBlocked = 0;
  let sessionBlocks = 0;

  // Variables to preserve user playback settings during ads
  let originalPlaybackRate = 1;
  let wasMuted = false;
  let adIsPlaying = false;

  // Load saved settings
  chrome.storage.sync.get(['adBlockerEnabled', 'adsBlocked', 'sessionBlocks'], function (data) {
    adBlockerEnabled = data.adBlockerEnabled !== undefined ? data.adBlockerEnabled : true;
    adsBlocked = data.adsBlocked || 0;
    sessionBlocks = data.sessionBlocks || 0;

    if (adBlockerEnabled) {
      injectAdBlockCSS();
      blockAds();
    }
  });

  // Listen for storage changes (decouples message passing and syncs all tabs)
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.adBlockerEnabled) {
      adBlockerEnabled = changes.adBlockerEnabled.newValue;
      if (adBlockerEnabled) {
        injectAdBlockCSS();
        blockAds();
      } else {
        removeAdBlockCSS();
        // Restore player settings if disabled mid-ad
        const video = document.querySelector('video');
        if (adIsPlaying && video) {
          video.playbackRate = originalPlaybackRate;
          video.muted = wasMuted;
          adIsPlaying = false;
        }
      }
    }
    if (changes.adsBlocked) {
      adsBlocked = changes.adsBlocked.newValue;
    }
    if (changes.sessionBlocks) {
      sessionBlocks = changes.sessionBlocks.newValue;
    }
  });

  // Function to block ads
  function blockAds() {
    if (!adBlockerEnabled) return;

    let adsRemoved = 0;

    // 1. Handle Video Ads (Speed up, Mute, Skip)
    const moviePlayer = document.querySelector('#movie_player');
    const isAdActive = (moviePlayer && (
      moviePlayer.classList.contains('ad-showing') || 
      moviePlayer.classList.contains('ad-interrupting')
    )) || document.querySelector('.ytp-ad-player-overlay, .ytp-ad-player-overlay-layout') !== null;

    const video = document.querySelector('video');

    if (isAdActive) {
      if (video) {
        if (!adIsPlaying) {
          // Save original settings (avoid saving 16x speed if we already sped it up)
          originalPlaybackRate = video.playbackRate === 16 ? 1 : video.playbackRate;
          wasMuted = video.muted;
          adIsPlaying = true;
        }
        // Speed up and mute
        video.muted = true;
        video.playbackRate = 16;

        // Skip to end of ad instantly if duration is available
        if (isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.1) {
          video.currentTime = video.duration - 0.1;
        }
      }

      // Click skip buttons
      const skipButtons = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
      skipButtons.forEach(button => {
        if (button.offsetParent !== null) { // Check if visible
          button.click();
          adsRemoved++;
        }
      });
    } else if (adIsPlaying) {
      // Ad finished, restore previous user settings
      if (video) {
        video.playbackRate = originalPlaybackRate;
        video.muted = wasMuted;
      }
      adIsPlaying = false;
    }

    // 2. Remove Banner Ads and Overlay Elements
    const videoAdSelectors = [
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '.ytp-ad-player-overlay',
      '.ytp-ad-image-overlay',
      '.ad-container',
      '.ytp-ad-preview-container',
      '.ytp-ad-overlay-slot'
    ];

    videoAdSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        ad.remove();
        adsRemoved++;
      });
    });

    // 3. Remove Homepage and Feed Ads
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
      '.ytd-in-feed-ad-layout-renderer',
      'ytd-rich-section-renderer[is-masthead-ad]',
      '#masthead-ad',
      'ytd-reel-video-renderer[is-ad]',
      'ytd-ad-slot-renderer[is-shorts-ad]',
      'ytd-search-pyv-renderer'
    ];

    homepageAdSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        ad.remove();
        adsRemoved++;
      });
    });

    // 4. Remove Video renderers containing Ad/Sponsored badges
    const videoRenderers = document.querySelectorAll('ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer');
    videoRenderers.forEach(element => {
      const badge = element.querySelector('.ytd-badge-supported-renderer, [class*="badge"], [aria-label*="Ad"], [title*="Sponsored"]');
      if (badge) {
        const text = badge.textContent.toLowerCase();
        if (text.includes('ad') || text.includes('sponsored') || text.includes('promoted')) {
          element.remove();
          adsRemoved++;
        }
      }
    });

    // 5. Update Block Statistics
    if (adsRemoved > 0) {
      adsBlocked += adsRemoved;
      sessionBlocks += adsRemoved;
      chrome.storage.sync.set({
        adsBlocked: adsBlocked,
        sessionBlocks: sessionBlocks
      });
    }
  }

  // Add CSS to hide ads dynamically
  function injectAdBlockCSS() {
    if (document.getElementById('youtube-adblock-css')) return;

    const style = document.createElement('style');
    style.id = 'youtube-adblock-css';
    style.textContent = `
      /* Hide video ad overlays and banners */
      .ytp-ad-overlay-container, .ytp-ad-text-overlay, .ytp-ad-player-overlay,
      .ytp-ad-image-overlay, .ad-container, .ytp-ad-preview-container, .ytp-ad-overlay-slot { display: none !important; }
      
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

      /* Hide sidebar ads */
      #secondary ytd-ad-slot-renderer, .ytd-item-section-renderer ytd-ad-slot-renderer { display: none !important; }

      /* Hide search result ads */
      ytd-search-pyv-renderer, ytd-promoted-sparkles-text-search-renderer { display: none !important; }

      /* Hide any element with ad indicators */
      [aria-label*="Ad ·"], [title*="Sponsored"], [data-ad="true"] { display: none !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // Remove injected CSS
  function removeAdBlockCSS() {
    const injectedCSS = document.getElementById('youtube-adblock-css');
    if (injectedCSS) {
      injectedCSS.remove();
    }
  }

  // Throttled execution of blockAds to prevent CPU spikes from MutationObserver
  let throttleTimeout = null;
  function throttledBlockAds() {
    if (throttleTimeout) return;
    throttleTimeout = setTimeout(() => {
      blockAds();
      throttleTimeout = null;
    }, 150);
  }

  // Set up MutationObserver on body to detect dynamically loaded elements
  const observer = new MutationObserver(function (mutations) {
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length) {
        throttledBlockAds();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Check periodically as a safety net
  setInterval(blockAds, 1000);

  // Handle page navigation in YouTube SPA (URL check)
  let currentUrl = location.href;
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(() => {
        if (adBlockerEnabled) {
          injectAdBlockCSS();
          blockAds();
        }
      }, 500);
    }
  }, 1000);
})();