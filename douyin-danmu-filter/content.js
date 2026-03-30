(() => {
  const STORAGE_KEY = "blockedKeywords";

  const DANMU_SELECTORS = [
    "[class*='chat'] [class*='message']",
    "[class*='danmu']",
    "[class*='comment']",
    "[data-e2e*='chat']",
    "[data-e2e*='comment']",
    "[data-e2e*='message']"
  ];

  let blockedKeywords = [];

  const normalizeKeywords = (raw) => {
    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw
        .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
        .filter(Boolean);
    }

    if (typeof raw === "string") {
      return raw
        .split(/[\n,，;；]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }

    return [];
  };

  const loadKeywords = async () => {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    blockedKeywords = normalizeKeywords(result[STORAGE_KEY]);
  };

  const getTextContent = (el) => (el?.innerText || el?.textContent || "").trim().toLowerCase();

  const shouldHide = (text) => blockedKeywords.some((keyword) => text.includes(keyword));

  const markHidden = (el) => {
    if (!el || el.dataset.danmuFilterHidden === "1") return;
    el.style.display = "none";
    el.dataset.danmuFilterHidden = "1";
  };

  const checkElement = (el) => {
    if (!(el instanceof HTMLElement)) return;
    const text = getTextContent(el);
    if (!text) return;
    if (shouldHide(text)) {
      markHidden(el);
    }
  };

  const queryCandidates = (root) => {
    const candidates = new Set();

    if (root instanceof HTMLElement) {
      candidates.add(root);
    }

    DANMU_SELECTORS.forEach((selector) => {
      root.querySelectorAll(selector).forEach((el) => candidates.add(el));
    });

    return Array.from(candidates);
  };

  const sweep = (root = document.body) => {
    if (!root) return;
    const candidates = queryCandidates(root);
    candidates.forEach(checkElement);
  };

  const observeMutations = () => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            sweep(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });
  };

  const initStorageListener = () => {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync" || !changes[STORAGE_KEY]) return;
      blockedKeywords = normalizeKeywords(changes[STORAGE_KEY].newValue);
      sweep(document.body);
    });
  };

  const start = async () => {
    await loadKeywords();
    sweep(document.body);
    observeMutations();
    initStorageListener();
  };

  start().catch((error) => {
    console.error("[DouyinDanmuFilter] 初始化失败:", error);
  });
})();
