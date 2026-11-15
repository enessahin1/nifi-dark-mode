const ENV_META = {
  prod: { label: 'Production', color: '#e5484d' },
  test: { label: 'Test', color: '#3b82f6' },
  dev: { label: 'Development', color: '#30ee85' },
  other: { label: 'Other', color: '#8a9ba8' },
};

const listEl = document.getElementById('list');
const form = document.getElementById('form');
const nameEl = document.getElementById('name');
const urlEl = document.getElementById('url');
const envEl = document.getElementById('env');

let clusters = [];

function save() {
  chrome.storage.sync.set({ nd_clusters: clusters });
}

function render() {
  listEl.innerHTML = '';

  if (!clusters.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No clusters added yet.';
    listEl.appendChild(empty);
    return;
  }

  for (const c of clusters) {
    const meta = ENV_META[c.env] || ENV_META.other;

    const row = document.createElement('div');
    row.className = 'row';

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = meta.color;

    const meta_ = document.createElement('span');
    meta_.className = 'meta';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = `${c.name} · ${meta.label}`;

    const url = document.createElement('div');
    url.className = 'url';
    url.textContent = c.url;

    meta_.append(name, url);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.title = 'Remove';
    remove.textContent = '✕';
    remove.addEventListener('click', () => {
      clusters = clusters.filter((x) => x.id !== c.id);
      save();
      render();
    });

    row.append(dot, meta_, remove);
    listEl.appendChild(row);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = nameEl.value.trim();
  const url = urlEl.value.trim();
  const env = envEl.value;
  if (!name || !url) return;

  clusters.push({ id: crypto.randomUUID(), name, url, env });
  save();
  render();
  form.reset();
  nameEl.focus();
});

chrome.storage.sync.get({ nd_clusters: [] }, ({ nd_clusters }) => {
  clusters = nd_clusters;
  render();
});

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.nd_clusters) return;
  clusters = changes.nd_clusters.newValue || [];
  render();
});
