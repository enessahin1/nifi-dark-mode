// Hamburger menu pages (Summary, etc.) open in an iframe inside #shell-dialog on the main page.
// The shell already inverts the filter, so the iframe document is unfiltered and styled with a separate class.
const CLASS = window === window.top ? 'nifi-dark' : 'nifi-dark-frame';
const SVG_NS = 'http://www.w3.org/2000/svg';

// The class needs to be applied before the chrome.storage response arrives: in those few milliseconds
// the page renders with its default white (a white flash was especially visible on pages like Data
// Provenance that open in an iframe). The last choice is cached in the same origin's localStorage,
// which can be read synchronously.
const CACHE_KEY = 'nifi-dark-mode-enabled';

function readCache() {
  try {
    return localStorage.getItem(CACHE_KEY) !== '0';
  } catch (e) {
    return true;
  }
}

function writeCache(enabled) {
  try {
    localStorage.setItem(CACHE_KEY, enabled ? '1' : '0');
  } catch (e) {
    // if localStorage is unavailable, continue without the cache
  }
}

function apply(enabled) {
  document.documentElement.classList.toggle(CLASS, enabled);
}

apply(readCache());

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  writeCache(enabled);
  apply(enabled);
});

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.enabled) return;
  writeCache(changes.enabled.newValue);
  apply(changes.enabled.newValue);
});

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

// Status shapes drawn at the exact center (cx, cy) of the badge. The font glyph snaps to the pixel
// grid, so it drifted inside the badge at small scales; a vector shape stays in the same spot at every
// scale. dark.css picks which one shows based on the source icon's status class. s: scale factor.
function makeGlyph(cx, cy, s) {
  const glyph = svgEl('g', { class: 'nd-glyph' });

  const play = svgEl('polygon', {
    class: 'nd-play',
    points: `${cx - 3.5 * s},${cy - 4 * s} ${cx - 3.5 * s},${cy + 4 * s} ${cx + 3.5 * s},${cy}`,
  });

  const stop = svgEl('rect', {
    class: 'nd-stop',
    x: cx - 3.5 * s,
    y: cy - 3.5 * s,
    width: 7 * s,
    height: 7 * s,
    rx: 0.8 * s,
  });

  const warn = svgEl('path', {
    class: 'nd-warn',
    'fill-rule': 'evenodd',
    d:
      `M${cx},${cy - 4.4 * s} L${cx + 4.8 * s},${cy + 3.8 * s} L${cx - 4.8 * s},${cy + 3.8 * s} Z ` +
      `M${cx - 0.6 * s},${cy - 1.4 * s} h${1.2 * s} v${2.8 * s} h${-1.2 * s} Z ` +
      `M${cx - 0.6 * s},${cy + 2 * s} h${1.2 * s} v${1 * s} h${-1.2 * s} Z`,
  });

  // disabled: ring and diagonal line
  const ban = svgEl('g', { class: 'nd-ban' });
  ban.append(
    svgEl('circle', { cx, cy, r: 3.9 * s, fill: 'none', stroke: '#000', 'stroke-width': 1.3 * s }),
    svgEl('line', {
      x1: cx - 2.8 * s, y1: cy + 2.8 * s, x2: cx + 2.8 * s, y2: cy - 2.8 * s,
      stroke: '#000', 'stroke-width': 1.3 * s,
    })
  );

  glyph.append(play, stop, warn, ban);
  return glyph;
}

// Draws a badge and shape behind the status icon (play/stop/...) of processors and input/output ports.
// dark.css colors it based on the icon's fill, so nothing needs to happen here when the status changes.
function addStatusBadges() {
  // [selector, badge's top-left corner]: processor icon x=55,y=23; port icon x=50,y=25
  const targets = [
    ['g.processor-canvas-details > text.run-status-icon', { x: 52, y: 9 }],
    ['g.port-details > text.run-status-icon', { x: 46, y: 10 }],
  ];

  for (const [selector, pos] of targets) {
    document.querySelectorAll(selector).forEach((icon) => {
      if (icon.previousElementSibling?.classList.contains('nd-badge')) return;

      const size = 20;
      const badge = svgEl('rect', { class: 'nd-badge', x: pos.x, y: pos.y, width: size, height: size, rx: 4 });
      icon.parentNode.insertBefore(badge, icon);
      icon.after(makeGlyph(pos.x + size / 2, pos.y + size / 2, 1.25));
    });
  }
}

// Draws a badge behind the running / stopped / invalid icons in a process group's count row.
// Only ones with a count greater than zero get colored (dark.css checks the icon's .zero class).
function addGroupBadges() {
  document
    .querySelectorAll(
      'g.process-group-details > text.process-group-running, ' +
      'g.process-group-details > text.process-group-stopped, ' +
      'g.process-group-details > text.process-group-invalid'
    )
    .forEach((icon) => {
      if (icon.previousElementSibling?.classList.contains('nd-badge')) return;

      const x = parseFloat(icon.getAttribute('x'));
      const y = parseFloat(icon.getAttribute('y'));
      // The badge is 14x14, centered on the icon's ink center (icon x + 6.5, baseline - 5.5). NiFi
      // computes the numbers' position from the glyph's width, so the font glyph stays in place,
      // it just becomes invisible.
      const size = 14;
      const cx = x + 6.5;
      const cy = y - 5.5;
      const badge = svgEl('rect', { class: 'nd-badge', x: cx - size / 2, y: cy - size / 2, width: size, height: size, rx: 3.5 });
      icon.parentNode.insertBefore(badge, icon);
      icon.after(makeGlyph(cx, cy, 0.9));
    });
}

// Icon to the left of the name in versioned process groups (check, star, etc.). The glyph stays 18px
// because NiFi computes the name's position from this icon's width.
function addVersionBadges() {
  document.querySelectorAll('g.process-group > text.version-control').forEach((icon) => {
    if (icon.previousElementSibling?.classList.contains('nd-badge')) return;

    const badge = document.createElementNS(SVG_NS, 'rect');
    badge.setAttribute('class', 'nd-badge');
    badge.setAttribute('x', '7');
    badge.setAttribute('y', '3');
    badge.setAttribute('width', '23');
    badge.setAttribute('height', '23');
    badge.setAttribute('rx', '5');
    icon.parentNode.insertBefore(badge, icon);
  });
}

// The status icon (play/stop) to the right of the "From ..." and "To ..." lines in a connection's label.
function addConnectionBadges() {
  document
    .querySelectorAll(
      'g.connection-from-container > text.connection-from-run-status, ' +
      'g.connection-to-container > text.connection-to-run-status'
    )
    .forEach((icon) => {
      if (icon.previousElementSibling?.classList.contains('nd-badge')) return;

      const x = parseFloat(icon.getAttribute('x'));
      const y = parseFloat(icon.getAttribute('y'));
      const badge = document.createElementNS(SVG_NS, 'rect');
      badge.setAttribute('class', 'nd-badge');
      badge.setAttribute('x', String(x - 6));
      badge.setAttribute('y', String(y - 12));
      badge.setAttribute('width', '15');
      badge.setAttribute('height', '15');
      badge.setAttribute('rx', '3.5');
      icon.parentNode.insertBefore(badge, icon);

      // the source icon's status class (running / stopped / is-missing-port) determines which shape shows
      icon.after(makeGlyph(x - 6 + 7.5, y - 12 + 7.5, 1));
    });
}

// NiFi redraws processor details on zoom and refresh.
let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    addStatusBadges();
    addGroupBadges();
    addVersionBadges();
    addConnectionBadges();
  });
}).observe(document.documentElement, { childList: true, subtree: true });
