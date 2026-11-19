# Nifi 1.x Dark Mode

A dark theme Chrome extension for the Apache NiFi web interface — easy on the eyes during long monitoring and development sessions.

[![Available in the Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/nifi-1x-dark-mode/lnpbddhgeiafkcdgkdehdgenliidhedp)

## Features

- Full dark theme across the NiFi canvas, toolbars, dialogs, and panels
- Shape-coded status badges, so state is still readable for color-blind users
- Invalid-component markers on the navigation minimap
- Instant on/off toggle from the toolbar popup
- Cluster manager: save known NiFi URLs and tag them as Production / Test / Development — a red warning frame is drawn around the screen whenever you're on a cluster marked as production
- 100% local — no data collection, no network requests

## Installation

**From the Chrome Web Store (recommended)**

Install directly: https://chromewebstore.google.com/detail/nifi-1x-dark-mode/lnpbddhgeiafkcdgkdehdgenliidhedp

**Manual / unpacked (for development)**

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the project folder

## Usage

- Click the extension icon to toggle the dark theme on or off. Changes apply instantly to open NiFi tabs.
- Click **Manage clusters** in the popup to register your NiFi environments and mark which ones are production, so you get a visual warning before making changes there.

## Privacy

This extension runs entirely on your machine. It does not collect data, track usage, or make any network requests.

## Support

Found a bug or have a feature request? Open an issue: https://github.com/enessahin1/nifi-dark-mode/issues

## Sponsor

If this extension saves your eyes, consider [sponsoring the project](https://github.com/sponsors/enessahin1).
