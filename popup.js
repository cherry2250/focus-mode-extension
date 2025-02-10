document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleButton");
  const addButton = document.getElementById("addButton");
  const urlInput = document.getElementById("urlInput");
  const urlList = document.getElementById("urlList");

  chrome.storage.local.get(["focusMode", "blockedUrls"], function (data) {
    updateButton(data.focusMode || false);
    updateUrlList(data.blockedUrls || []);
  });

  toggleButton.addEventListener("click", function () {
    chrome.storage.local.get(["focusMode"], function (data) {
      let newState = !data.focusMode;
      chrome.runtime.sendMessage(
        { action: "toggleFocus", state: newState },
        () => {
          updateButton(newState);
        }
      );
    });
  });

  addButton.addEventListener("click", function () {
    const url = urlInput.value.trim();
    if (url) {
      chrome.runtime.sendMessage({ action: "addUrl", url }, () => {
        urlInput.value = ""; // 추가 후 input 박스 비우기
        refreshUrlList();
      });
    }
  });

  function updateButton(isEnabled) {
    toggleButton.textContent = isEnabled ? "Focus Mode OFF" : "Focus Mode ON";
    toggleButton.style.backgroundColor = isEnabled ? "red" : "green";
  }

  function refreshUrlList() {
    chrome.storage.local.get(["blockedUrls"], function (data) {
      updateUrlList(data.blockedUrls || []);
    });
  }

  function updateUrlList(urls) {
    urlList.innerHTML = "";
    urls.forEach((url) => {
      const li = document.createElement("li");
      li.textContent = url;
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
});
