document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleButton");

  // 저장된 Focus Mode 상태 가져오기
  chrome.storage.local.get(["focusMode"], function (result) {
    let isEnabled = result.focusMode || false;
    updateButton(isEnabled);
  });

  // 버튼 클릭 시 focusMode 상태 변경
  toggleButton.addEventListener("click", function () {
    chrome.storage.local.get(["focusMode"], function (result) {
      let isEnabled = !result.focusMode; // 상태 반전

      chrome.storage.local.set({ focusMode: isEnabled }, function () {
        updateButton(isEnabled); // 버튼 상태 업데이트
        // Background로 메시지 보내기
        chrome.runtime.sendMessage(
          { action: "toggleFocus", state: isEnabled },
          function (response) {
            if (chrome.runtime.lastError) {
              console.error(
                "❌ 메시지 처리 중 오류 발생:",
                chrome.runtime.lastError
              );
            } else {
              console.log("✅ Focus mode가 성공적으로 변경되었습니다.");
            }
          }
        );
      });
    });
  });

  // 버튼 텍스트와 스타일 업데이트
  function updateButton(isEnabled) {
    toggleButton.textContent = isEnabled ? "Focus Mode OFF" : "Focus Mode ON";
    toggleButton.style.backgroundColor = isEnabled ? "red" : "green";
  }
});
