// background.js

// Focus Mode 상태 전환 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleFocus") {
    toggleFocusMode(message.state);
    sendResponse({ success: true });
  }
});

// Focus Mode 상태 변경 시 처리
function toggleFocusMode(isEnabled) {
  if (isEnabled) {
    applyBlockRules(); // 차단 규칙 적용
  } else {
    removeBlockRules(); // 차단 규칙 해제
  }
}

// 차단 규칙 적용
function applyBlockRules() {
  chrome.storage.local.get(["blockedUrls"], function (result) {
    let blockedUrls = result.blockedUrls || [];

    // 유튜브 차단 규칙 추가
    const youtubeBlockRule = {
      id: 1, // 고유한 규칙 ID
      priority: 1,
      action: { type: "block" },
      condition: {
        regexFilter: "^https?://www.youtube.com.*", // 유튜브 URL 차단 정규식
        resourceTypes: [
          "main_frame",
          "sub_frame",
          "script",
          "stylesheet",
          "image",
          "xmlhttprequest",
          "object",
          "font",
        ], // 모든 리소스 차단
      },
    };

    // 차단할 URL들을 리스트로 만들어 추가
    const rules = [
      youtubeBlockRule,
      ...blockedUrls.map((url, index) => ({
        id: index + 2, // 규칙 ID 고유하게 설정
        priority: 1,
        action: { type: "block" },
        condition: {
          regexFilter: `^${url}.*`,
          resourceTypes: ["main_frame"],
        },
      })),
    ];

    // 기존에 유튜브 차단 규칙이 있는지 확인하고, 중복되지 않도록 처리
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: rules,
        removeRuleIds: [1, 2, 3], // 기존 규칙들을 제거
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("❌ 규칙 추가 중 오류 발생:", chrome.runtime.lastError);
        } else {
          console.log("✅ 차단 규칙 적용됨");

          // 적용된 규칙 확인
          chrome.declarativeNetRequest.getDynamicRules({}, function (rules) {
            console.log("현재 등록된 차단 규칙:", rules);
          });
        }
      }
    );
  });
}

// 차단 규칙 해제
function removeBlockRules() {
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules: [],
      removeRuleIds: [1, 2, 3], // 모든 규칙 제거
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("❌ 규칙 제거 중 오류 발생:", chrome.runtime.lastError);
      } else {
        console.log("✅ 차단 규칙 해제됨");
      }
    }
  );
}
