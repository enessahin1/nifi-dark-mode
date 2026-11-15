const toggle = document.getElementById('toggle');
const state = document.getElementById('state');

document.documentElement.lang = chrome.i18n.getUILocale().startsWith('tr') ? 'tr' : 'en';
document.title = chrome.i18n.getMessage('extName');
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
});

function render(enabled) {
  toggle.setAttribute('aria-checked', String(enabled));
  state.textContent = chrome.i18n.getMessage(enabled ? 'stateOn' : 'stateOff');
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => render(enabled));

toggle.addEventListener('click', () => {
  const enabled = toggle.getAttribute('aria-checked') !== 'true';
  render(enabled);
  chrome.storage.sync.set({ enabled });
});
