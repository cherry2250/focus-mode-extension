chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ focusMode: false, blockedUrls: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleFocus") {
    chrome.storage.local.set({ focusMode: message.state }, () => {
      updateBlockingRules();
      sendResponse({ success: true });
    });
    return true;
  } else if (message.action === "addBlockedUrl") {
    chrome.storage.local.get("blockedUrls", (data) => {
      const blockedUrls = data.blockedUrls || [];
      if (!blockedUrls.includes(message.url)) {
        blockedUrls.push(message.url);
        chrome.storage.local.set({ blockedUrls }, () => {
          updateBlockingRules();
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: "이미 존재하는 URL입니다." });
      }
    });
    return true;
  } else if (message.action === "removeBlockedUrl") {
    chrome.storage.local.get("blockedUrls", (data) => {
      const blockedUrls = data.blockedUrls || [];
      const newBlockedUrls = blockedUrls.filter((url) => url !== message.url);
      chrome.storage.local.set({ blockedUrls: newBlockedUrls }, () => {
        updateBlockingRules();
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

function updateBlockingRules() {
  chrome.storage.local.get(["focusMode", "blockedUrls"], (data) => {
    if (!data.focusMode) {
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], addRules: [] },
        () => console.log("✅ 차단 규칙 해제됨")
      );
      return;
    }

    const newRules = [];
    let ruleId = 1;

    data.blockedUrls.forEach((url) => {
      const regexUrl = url.replace(".", "\\.");
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: { type: "block" },
        condition: {
          regexFilter: `^https?://(www\\.)?${regexUrl}.*`,
          resourceTypes: [
            "main_frame",
            "sub_frame",
            "script",
            "xmlhttprequest",
            "stylesheet",
            "image",
          ],
        },
      });
    });

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: Array.from({ length: 10 }, (_, i) => i + 1),
        addRules: newRules,
      },
      () => console.log("✅ 차단 규칙 적용됨", newRules)
    );
  });
}
