document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleButton");
  const blockUrlInput = document.getElementById("blockUrlInput");
  const addBlockButton = document.getElementById("addBlockButton");
  const blockedList = document.getElementById("blockedList");

  chrome.storage.local.get(["focusMode", "blockedUrls"], function (result) {
    let isEnabled = result.focusMode || false;
    updateButton(isEnabled);
    updateBlockedList(result.blockedUrls || []);
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

  addBlockButton.addEventListener("click", function () {
    const url = blockUrlInput.value.trim();
    if (!url) return;

    chrome.storage.local.get(["blockedUrls"], function (result) {
      let blockedUrls = result.blockedUrls || [];

      if (!blockedUrls.includes(url)) {
        blockedUrls.push(url);
        chrome.storage.local.set({ blockedUrls }, function () {
          updateBlockedList(blockedUrls);
          chrome.runtime.sendMessage({ action: "updateRules", blockedUrls });
        });
      }
    });
  });

  function updateButton(isEnabled) {
    toggleButton.textContent = isEnabled ? "Focus Mode OFF" : "Focus Mode ON";
    toggleButton.style.backgroundColor = isEnabled ? "red" : "green";
  }

  function updateBlockedList(blockedUrls) {
    blockedList.innerHTML = "";
    blockedUrls.forEach((url) => {
      const li = document.createElement("li");
      li.textContent = url;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "삭제";
      removeBtn.addEventListener("click", function () {
        blockedUrls = blockedUrls.filter((item) => item !== url);
        chrome.storage.local.set({ blockedUrls }, function () {
          updateBlockedList(blockedUrls);
          chrome.runtime.sendMessage({ action: "updateRules", blockedUrls });
        });
      });
      li.appendChild(removeBtn);
      blockedList.appendChild(li);
    });
  }
});
