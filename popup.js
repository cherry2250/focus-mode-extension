document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.querySelector(".toggleSwitch"); // 토글 스위치 전체 선택
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");
  const urlList = document.getElementById("urlList");

  // 저장된 Focus Mode 상태 가져오기
  chrome.storage.local.get(["focusMode", "blockedUrls"], function (result) {
    updateToggle(result.focusMode || false);
    updateUrlList(result.blockedUrls || []);
  });

  // 토글 스위치 클릭 이벤트 (Focus Mode ON/OFF)
  toggleSwitch.addEventListener("click", function () {
    chrome.storage.local.get(["focusMode"], function (result) {
      let isEnabled = !result.focusMode;

      chrome.storage.local.set({ focusMode: isEnabled }, function () {
        updateToggle(isEnabled); // UI 업데이트
        chrome.runtime.sendMessage({ action: "toggleFocus", state: isEnabled });
      });
    });
  });

  // URL 추가 버튼 클릭 이벤트
  addButton.addEventListener("click", function () {
    let url = urlInput.value.trim().toLowerCase(); // 입력값을 소문자로 변환
    url = normalizeUrl(url); // www. 제거

    if (url) {
      chrome.runtime.sendMessage({ action: "addUrl", url }, () => {
        urlInput.value = ""; // 입력 필드 비우기
        refreshUrlList();
      });
    }
  });

  // UI의 토글 상태를 업데이트하는 함수
  function updateToggle(isEnabled) {
    if (isEnabled) {
      toggleSwitch.classList.add("active"); // 활성화 클래스 추가
    } else {
      toggleSwitch.classList.remove("active"); // 활성화 클래스 제거
    }
  }

  function refreshUrlList() {
    chrome.storage.local.get(["blockedUrls"], function (result) {
      updateUrlList(result.blockedUrls || []);
    });
  }

  function updateUrlList(urls) {
    urlList.innerHTML = "";
    urls.forEach((url) => {
      const li = document.createElement("li");
      li.textContent = url.toLowerCase(); // UI에서도 소문자로 표시
      const removeButton = document.createElement("button");
      removeButton.textContent = "삭제";
      removeButton.addEventListener("click", function () {
        chrome.runtime.sendMessage(
          { action: "removeUrl", url },
          refreshUrlList
        );
      });
      li.appendChild(removeButton);
      urlList.appendChild(li);
    });
  }

  function normalizeUrl(url) {
    return url.replace(/^www\./, "").toLowerCase(); // www. 제거 + 소문자로 변환
  }
});
