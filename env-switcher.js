// Birden fazla NiFi cluster'ı arasında hızlı geçiş menüsü ve ortam (prod/test/dev) renk göstergesi.
// Cluster listesi chrome.storage.sync içinde 'nd_clusters' anahtarında tutulur, options.html'den yönetilir.
// Yalnızca üst çerçevede çalışır (manifest'te all_frames verilmedi), sağ-alt köşede sabit bir widget olarak eklenir.

const ENV_META = {
  prod: { label: 'PROD', color: '#e5484d' },
  test: { label: 'TEST', color: '#3b82f6' },
  dev: { label: 'DEV', color: '#30ee85' },
  other: { label: '', color: '#8a9ba8' },
};

let clusters = [];
let widget = null;
let pill = null;
let dropdown = null;
let isOpen = false;

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch (e) {
    return null;
  }
}

function activeCluster() {
  const here = location.origin;
  return clusters.find((c) => originOf(c.url) === here) || null;
}

function setOpen(next) {
  isOpen = next;
  dropdown.classList.toggle('nd-env-open', isOpen);
  pill.setAttribute('aria-expanded', String(isOpen));
}

function renderItem(c, active) {
  const meta = ENV_META[c.env] || ENV_META.other;
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'nd-env-item';
  if (active && c.id === active.id) item.setAttribute('aria-current', 'true');
  item.style.setProperty('--nd-env-color', meta.color);

  const dot = document.createElement('span');
  dot.className = 'nd-env-dot';

  const name = document.createElement('span');
  name.className = 'nd-env-name';
  name.textContent = c.name || c.url;

  const tag = document.createElement('span');
  tag.className = 'nd-env-tag';
  tag.textContent = meta.label;

  item.append(dot, name, tag);
  item.addEventListener('click', () => {
    setOpen(false);
    if (!active || c.id !== active.id) location.href = c.url;
  });
  return item;
}

function render() {
  if (!widget) return;

  if (!clusters.length) {
    widget.style.display = 'none';
    return;
  }
  widget.style.display = '';

  const active = activeCluster();
  const meta = ENV_META[active?.env] || ENV_META.other;
  pill.style.setProperty('--nd-env-color', meta.color);
  pill.textContent = active ? (active.name || meta.label || 'NiFi') : 'NiFi';

  dropdown.innerHTML = '';
  for (const c of clusters) dropdown.appendChild(renderItem(c, active));

  const manage = document.createElement('button');
  manage.type = 'button';
  manage.className = 'nd-env-manage';
  manage.textContent = 'Clusterları yönet…';
  manage.addEventListener('click', () => {
    setOpen(false);
    window.open(chrome.runtime.getURL('options.html'), '_blank');
  });
  dropdown.appendChild(manage);
}

function buildWidget() {
  widget = document.createElement('div');
  widget.className = 'nd-env-widget';

  dropdown = document.createElement('div');
  dropdown.className = 'nd-env-dropdown';

  pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'nd-env-pill';
  pill.setAttribute('aria-expanded', 'false');
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!isOpen);
  });

  widget.append(dropdown, pill);
  document.body.appendChild(widget);

  document.addEventListener('click', () => setOpen(false));
}

function init() {
  buildWidget();
  chrome.storage.sync.get({ nd_clusters: [] }, ({ nd_clusters }) => {
    clusters = nd_clusters;
    render();
  });
}

if (document.body) init();
else document.addEventListener('DOMContentLoaded', init, { once: true });

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.nd_clusters) return;
  clusters = changes.nd_clusters.newValue || [];
  render();
});
