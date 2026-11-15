const toggle = document.getElementById('toggle');
const state = document.getElementById('state');

function render(enabled) {
  toggle.setAttribute('aria-checked', String(enabled));
  state.textContent = enabled ? 'Açık' : 'Kapalı';
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => render(enabled));

toggle.addEventListener('click', () => {
  const enabled = toggle.getAttribute('aria-checked') !== 'true';
  render(enabled);
  chrome.storage.sync.set({ enabled });
});
