# YouTube Ad Blocker Chrome Extension

A powerful Chrome extension that blocks YouTube ads including video ads, homepage ads, sidebar ads, and more.

## Features

- ✅ Blocks video ads (pre-roll, mid-roll, post-roll)
- ✅ Removes homepage and feed ads
- ✅ Hides sidebar promotional content
- ✅ Auto-clicks skip buttons
- ✅ Blocks YouTube Shorts ads
- ✅ Real-time ad blocking statistics
- ✅ Toggle on/off functionality
- ✅ Session tracking

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your Chrome toolbar

## Usage

- Click the extension icon to view statistics and toggle ad blocking
- The extension works automatically on YouTube pages
- Right-click the extension icon for quick toggle options
- Refresh YouTube pages after enabling/disabling for best results

## Files Structure

- `manifest.json` - Extension configuration
- `background.js` - Service worker for extension management
- `content.js` - Main ad blocking logic
- `adblock.css` - CSS rules for hiding ads
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `styles.css` - Popup styling

## How It Works

The extension uses multiple techniques to block ads:

1. **CSS Injection** - Hides known ad elements immediately
2. **DOM Manipulation** - Removes ad containers dynamically
3. **Auto-Skip** - Automatically clicks skip buttons
4. **Mutation Observer** - Detects and blocks dynamically loaded ads
5. **Fallback Protection** - Speeds up ad playback when other methods fail

## Privacy

This extension:
- Only runs on YouTube domains
- Stores minimal data locally (preferences and statistics)
- Does not collect or transmit personal information
- Does not modify content outside of ad blocking

## Troubleshooting

If ads are still showing:
1. Refresh the YouTube page
2. Check that the extension is enabled in the popup
3. Try disabling and re-enabling the extension
4. Clear browser cache and cookies for YouTube

## Legal Notice

This extension is for educational purposes. Users are responsible for compliance with YouTube's Terms of Service.