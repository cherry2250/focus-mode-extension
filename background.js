chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleFocus") {
    if (message.state) {
      applyBlockingRules();
    } else {
      removeBlockingRules();
    }
  } else if (message.action === "updateRules") {
    updateBlockingRules(message.blockedUrls);
  }
});

function applyBlockingRules() {
  chrome.storage.local.get(["blockedUrls"], function (result) {
    const blockedUrls = result.blockedUrls || [];
    updateBlockingRules(blockedUrls);
  });
}

function removeBlockingRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const ruleIdsToRemove = rules.map((rule) => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: ruleIdsToRemove },
      () => console.log("✅ 모든 차단 규칙이 삭제됨")
    );
  });
}

function updateBlockingRules(blockedUrls) {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const existingRuleIds = rules.map((rule) => rule.id);
    const newRules = [];
    let ruleId = 1;

    blockedUrls.forEach((url) => {
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: { type: "block" },
        condition: {
          regexFilter: `^https?://${url}.*`,
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
        removeRuleIds: existingRuleIds,
        addRules: newRules,
      },
      () => console.log("✅ 새로운 차단 규칙 적용됨", newRules)
    );
  });
}
