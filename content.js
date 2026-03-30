const STORAGE_KEY = 'blockedKeywords';
const HIDDEN_CLASS = 'dy-danmu-filter-hidden';

let blockedKeywords = [];

function normalizeKeywords(rawKeywords) {
  return (rawKeywords || [])
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
}

function textMatchesKeywords(text) {
  if (!text || blockedKeywords.length === 0) {
    return false;
  }

  const normalizedText = text.toLowerCase();
  return blockedKeywords.some((keyword) => normalizedText.includes(keyword));
}

function hideIfMatched(node) {
  if (!(node instanceof HTMLElement)) {
    return;
  }

  const text = node.innerText || node.textContent || '';
  if (textMatchesKeywords(text)) {
    node.classList.add(HIDDEN_CLASS);
    node.dataset.dyDanmuFiltered = '1';
  } else {
    node.classList.remove(HIDDEN_CLASS);
    delete node.dataset.dyDanmuFiltered;
  }
}

function processCandidateNode(node) {
  if (!(node instanceof HTMLElement)) {
    return;
  }

  const possibleDanmuNodes = [
    node,
    ...node.querySelectorAll('[data-e2e="message-item"], .webcast-chatroom___item, .chatroom-item, [class*="chatroom"], [class*="message-item"]')
  ];

  for (const candidate of possibleDanmuNodes) {
    hideIfMatched(candidate);
  }
}

function ensureStyle() {
  if (document.getElementById('dy-danmu-filter-style')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'dy-danmu-filter-style';
  style.textContent = `
    .${HIDDEN_CLASS} {
      display: none !important;
    }
  `;

  document.documentElement.appendChild(style);
}

function rescanPage() {
  const candidates = document.querySelectorAll('[data-e2e="message-item"], .webcast-chatroom___item, .chatroom-item, [class*="chatroom"], [class*="message-item"]');
  candidates.forEach((node) => hideIfMatched(node));
}

function startObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        processCandidateNode(addedNode);
      }
      if (mutation.type === 'characterData' && mutation.target?.parentElement) {
        processCandidateNode(mutation.target.parentElement);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function loadKeywordsAndApply() {
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    blockedKeywords = normalizeKeywords(result[STORAGE_KEY]);
    rescanPage();
  });
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !changes[STORAGE_KEY]) {
      return;
    }

    blockedKeywords = normalizeKeywords(changes[STORAGE_KEY].newValue);
    rescanPage();
  });
}

function init() {
  ensureStyle();
  loadKeywordsAndApply();
  setupStorageListener();
  startObserver();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
