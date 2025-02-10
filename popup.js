document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleButton");
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");
  const urlList = document.getElementById("urlList");

  // 저장된 Focus Mode 상태 가져오기
  chrome.storage.local.get(["focusMode", "blockedUrls"], function (result) {
    updateButton(result.focusMode || false);
    updateUrlList(result.blockedUrls || []);
  });

  toggleButton.addEventListener("click", function () {
    chrome.storage.local.get(["focusMode"], function (result) {
      let isEnabled = !result.focusMode;

      chrome.storage.local.set({ focusMode: isEnabled }, function () {
        updateButton(isEnabled);
        chrome.runtime.sendMessage({ action: "toggleFocus", state: isEnabled });
      });
    });
  });

  addButton.addEventListener("click", function () {
    let url = urlInput.value.trim().toLowerCase(); //  입력값을 소문자로 변환
    url = normalizeUrl(url); //  www. 제거

    if (url) {
      chrome.runtime.sendMessage({ action: "addUrl", url }, () => {
        urlInput.value = ""; // 입력 필드 비우기
        refreshUrlList();
      });
    }
  });

  function updateButton(isEnabled) {
    toggleButton.textContent = isEnabled ? "Focus Mode OFF" : "Focus Mode ON";
    toggleButton.style.backgroundColor = isEnabled ? "red" : "green";
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
    return url.replace(/^www\./, "").toLowerCase(); //  www. 제거 + 소문자로 변환
  }
});
