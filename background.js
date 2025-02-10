chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ focusMode: false, blockedUrls: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleFocus") {
    chrome.storage.local.get(["focusMode", "blockedUrls"], (data) => {
      const newState = message.state;
      chrome.storage.local.set({ focusMode: newState }, () => {
        if (newState) {
          applyBlockRules(data.blockedUrls);
        } else {
          clearBlockRules();
        }
      });
    });
    sendResponse({ success: true });
  }

  if (message.action === "addUrl") {
    chrome.storage.local.get(["blockedUrls", "focusMode"], (data) => {
      let updatedUrls = new Set(data.blockedUrls);
      updatedUrls.add(normalizeUrl(message.url)); // youtube.com과 www.youtube.com을 하나로 처리

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
      let updatedUrls = data.blockedUrls.filter((url) => url !== message.url);
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
  return url.replace(/^www\./, ""); // www.youtube.com과 youtube.com을 같은 규칙으로 처리
}
