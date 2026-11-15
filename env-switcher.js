// Production olarak işaretlenmiş bir NiFi cluster'ında ekranı kırmızı çerçeveye alır.
// Cluster listesi chrome.storage.sync içinde 'nd_clusters' anahtarında tutulur, options.html'den yönetilir.
// Yalnızca üst çerçevede çalışır (manifest'te all_frames verilmedi). Çerçevenin görünümü dark.css'te.

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

// NiFi sayfanın en üstüne ve en altına node adını ("Node-0") yazan 10px'lik şeritler koyuyor.
// Çerçeve bu yazıların üstüne binip onları kesmesin diye şeritlerin yüksekliği kadar içeriden başlar.
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

// Şeritler sayfa yüklendikten sonra dolabilir, pencere boyutu da değişebilir.
window.addEventListener('load', placeFrame);
window.addEventListener('resize', placeFrame);

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.nd_clusters) return;
  clusters = changes.nd_clusters.newValue || [];
  render();
});
