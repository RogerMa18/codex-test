const STORAGE_KEY = 'blockedKeywords';

const keywordsInput = document.getElementById('keywords');
const saveButton = document.getElementById('save');
const statusText = document.getElementById('status');

function setStatus(text) {
  statusText.textContent = text;
  if (text) {
    window.setTimeout(() => {
      statusText.textContent = '';
    }, 1800);
  }
}

function parseKeywords(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadKeywords() {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    const keywords = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
    keywordsInput.value = keywords.join('\n');
  });
}

function saveKeywords() {
  const keywords = parseKeywords(keywordsInput.value);
  chrome.storage.sync.set({ [STORAGE_KEY]: keywords }, () => {
    setStatus(`已保存 ${keywords.length} 个关键词`);
  });
}

saveButton.addEventListener('click', saveKeywords);
document.addEventListener('DOMContentLoaded', loadKeywords);
