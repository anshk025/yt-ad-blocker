# 🚀 YouTube Ad Blocker — Lightweight Chrome Extension

A lightweight, high-performance Chrome Extension (Manifest V3) designed to automatically block, skip, and suppress video and banner ads on YouTube without background bloat or analytics tracking.

---

## ✨ Features

- ⚡ **Auto Ad-Skip**: Automatically detects and skips pre-roll and mid-roll video ads in real time.
- 🛡️ **Banner & Overlay Removal**: Hides overlay banners, sponsored cards, and suggested promotions via CSS/DOM injection.
- 🔒 **Zero Telemetry**: No tracking, no external API calls, and zero data collection.
- 🪶 **Ultra Lightweight**: Runs purely on event-driven mutation observers with negligible CPU and memory footprint.

---

## 🛠️ Installation (Chrome / Brave / Edge)

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/anshk025/yt-ad-blocker.git
   ```
2. Open your Chromium browser and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** (toggle located in the top-right corner).
4. Click **Load unpacked** in the top-left corner.
5. Select the `yt-ad-blocker` folder containing `manifest.json`.
6. Navigate to [YouTube](https://www.youtube.com) and enjoy ad-free playback!

---

## 📁 Project Structure

```text
yt-ad-blocker/
├── manifest.json     # Chrome Extension Manifest (V3)
├── background.js     # Service worker / background controller
├── content.js        # DOM MutationObserver & ad-skip automation
├── adblock.css       # Clean CSS stylesheet for ad suppression
├── popup.html        # Extension toggle & status popup
├── popup.js          # Popup UI controller logic
└── icons/            # Extension icons
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
