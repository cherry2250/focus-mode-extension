chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleFocus") {
    chrome.storage.local.get(["focusMode", "blockedUrls"], (data) => {
      if (message.state) {
        applyBlockRules(data.blockedUrls || []);
      } else {
        clearBlockRules();
      }
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "addUrl") {
    chrome.storage.local.get(["blockedUrls", "focusMode"], (data) => {
      let updatedUrls = new Set(data.blockedUrls);
      updatedUrls.add(normalizeUrl(message.url.toLowerCase())); // URL을 소문자로 변환 후 추가

      chrome.storage.local.set({ blockedUrls: Array.from(updatedUrls) }, () => {
        if (data.focusMode) {
          applyBlockRules(Array.from(updatedUrls));
        }
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.action === "removeUrl") {
    chrome.storage.local.get(["blockedUrls", "focusMode"], (data) => {
      let updatedUrls = data.blockedUrls.filter(
        (url) => url !== message.url.toLowerCase()
      ); // 소문자로 비교
      chrome.storage.local.set({ blockedUrls: updatedUrls }, () => {
        if (data.focusMode) {
          applyBlockRules(updatedUrls);
        }
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

function applyBlockRules(urls) {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingIds = existingRules.map((rule) => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: existingIds,
        addRules: urls.map((url, index) => ({
          id: index + 1,
          priority: 1,
          action: { type: "block" },
          condition: {
            regexFilter: `^https?://(www\\.)?${url}.*`,
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "script",
              "xmlhttprequest",
              "media",
              "websocket",
              "other",
            ], // Main 이외의 영역 차단 추가
          },
        })),
      },
      () => {
        console.log("✅ 차단 규칙 업데이트 완료:", urls);
      }
    );
  });
}

function clearBlockRules() {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingIds = existingRules.map((rule) => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: existingIds,
      },
      () => {
        console.log("✅ 모든 차단 규칙 해제 완료");
      }
    );
  });
}

function normalizeUrl(url) {
  return url.replace(/^www\./, "").toLowerCase(); // www.youtube.com과 youtube.com을 같은 규칙으로 처리
}
