const STORAGE_KEY = "blockedKeywords";

const keywordsInput = document.getElementById("keywords");
const saveBtn = document.getElementById("saveBtn");
const statusText = document.getElementById("status");

const parseKeywords = (rawText) => {
  return rawText
    .split(/[\n,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const setStatus = (message, isError = false) => {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b91c1c" : "#047857";
};

const loadKeywords = async () => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];

  if (Array.isArray(stored)) {
    keywordsInput.value = stored.join("\n");
  } else if (typeof stored === "string") {
    keywordsInput.value = stored;
  }
};

const saveKeywords = async () => {
  const keywords = parseKeywords(keywordsInput.value);
  await chrome.storage.sync.set({ [STORAGE_KEY]: keywords });
  setStatus(`已保存 ${keywords.length} 个屏蔽词`);
};

saveBtn.addEventListener("click", () => {
  saveKeywords().catch((error) => {
    console.error("保存失败:", error);
    setStatus("保存失败，请重试", true);
  });
});

loadKeywords().catch((error) => {
  console.error("读取失败:", error);
  setStatus("读取已保存关键词失败", true);
});
