// Puts a red frame around the screen on a NiFi cluster marked as production.
// The cluster list is kept under the 'nd_clusters' key in chrome.storage.sync, managed from options.html.
// Only runs in the top frame (all_frames not set in the manifest). The frame's appearance lives in dark.css.

let clusters = [];
let frame = null;

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch (e) {
    return null;
  }
}

function isProduction() {
  return clusters.some((c) => c.env === 'prod' && originOf(c.url) === location.origin);
}

// NiFi puts 10px strips at the very top and bottom of the page showing the node name ("Node-0").
// The frame starts inset by the strips' height so it doesn't overlap and cut into that text.
function placeFrame() {
  if (!frame) return;
  frame.style.top = `${document.getElementById('banner-header')?.offsetHeight || 0}px`;
  frame.style.bottom = `${document.getElementById('banner-footer')?.offsetHeight || 0}px`;
}

function render() {
  if (!document.body) return;

  if (isProduction()) {
    if (!frame) {
      frame = document.createElement('div');
      frame.className = 'nd-prod-frame';
      frame.setAttribute('aria-hidden', 'true');
    }
    if (!frame.isConnected) document.body.appendChild(frame);
    placeFrame();
  } else if (frame) {
    frame.remove();
    frame = null;
  }
}

function init() {
  chrome.storage.sync.get({ nd_clusters: [] }, ({ nd_clusters }) => {
    clusters = nd_clusters;
    render();
  });
}

if (document.body) init();
else document.addEventListener('DOMContentLoaded', init, { once: true });

// The strips can fill in after the page loads, and the window can also be resized.
window.addEventListener('load', placeFrame);
window.addEventListener('resize', placeFrame);

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.nd_clusters) return;
  clusters = changes.nd_clusters.newValue || [];
  render();
});
