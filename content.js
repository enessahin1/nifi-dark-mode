// Hamburger menü sayfaları (Summary vb.) ana sayfada #shell-dialog içindeki bir iframe'de açılır.
// Kabuk filtreyi zaten ters çevirdiği için iframe belgesi filtresiz, ayrı bir sınıfla boyanır.
const CLASS = window === window.top ? 'nifi-dark' : 'nifi-dark-frame';
const SVG_NS = 'http://www.w3.org/2000/svg';

// Sınıfın chrome.storage cevabından önce verilmesi gerekiyor: o birkaç milisaniyede sayfa varsayılan
// beyazıyla çizilir (özellikle iframe'de açılan Data Provenance gibi sayfalarda beyaz kare görünüyordu).
// Son seçim, aynı origin'in localStorage'ında eşzamanlı okunabilen bir önbellekte tutulur.
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
    // localStorage kapalıysa önbellek olmadan devam eder
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

// Rozetin tam merkezine (cx, cy) çizilen durum şekilleri. Yazı tipi glifi piksel ızgarasına oturtulduğu
// için küçük ölçekte rozetin içinde kayıyordu; vektör şekil her ölçekte aynı yerde kalır.
// Hangisinin görüneceğini dark.css, kaynak ikonun durumuna bakarak seçer. s: ölçek.
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

  // disabled: halka ve çapraz çizgi
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

// Processor'ların ve input/output portların durum ikonunun (play/stop/...) arkasına rozet ve şekil çizer.
// Rengi dark.css, ikonun fill'ine bakarak verir, bu yüzden durum değişince burada bir şey yapmaya gerek yok.
function addStatusBadges() {
  // [seçici, rozetin sol üst köşesi]: processor ikonu x=55,y=23; port ikonu x=50,y=25
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

// Process group'ların sayaç satırında çalışan / durmuş / invalid ikonlarının arkasına rozet çizer.
// Yalnızca sayısı sıfırdan büyük olanlar renklenir (dark.css, ikonun .zero sınıfına bakar).
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
      // Rozet 14x14, ikonun mürekkep merkezine (ikon x + 6.5, taban çizgisi - 5.5) oturur. NiFi sayıların
      // konumunu glifin genişliğine göre hesapladığı için yazı tipi glifi yerinde kalır, sadece görünmez olur.
      const size = 14;
      const cx = x + 6.5;
      const cy = y - 5.5;
      const badge = svgEl('rect', { class: 'nd-badge', x: cx - size / 2, y: cy - size / 2, width: size, height: size, rx: 3.5 });
      icon.parentNode.insertBefore(badge, icon);
      icon.after(makeGlyph(cx, cy, 0.9));
    });
}

// Versiyonlu process group'larda ismin solundaki ikon (check, yıldız, vb.). Glif 18px kalır,
// çünkü NiFi ismin konumunu bu ikonun genişliğine göre hesaplıyor.
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

// Connection etiketinde "From ..." ve "To ..." satırlarının sağındaki durum ikonu (play/stop).
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

      // kaynak ikonun durum sınıfı (running / stopped / is-missing-port) hangi şeklin görüneceğini belirler
      icon.after(makeGlyph(x - 6 + 7.5, y - 12 + 7.5, 1));
    });
}

// NiFi yakınlaştırma ve yenilemede processor detaylarını yeniden çiziyor.
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
