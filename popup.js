chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  const url = tabs[0].url || "";
  const statusBox = document.getElementById("statusBox");
  
  if (url.includes("splitwise.com")) {
    statusBox.textContent = "Premium Activated";
    statusBox.className = "status active";
  } else {
    statusBox.textContent = "Inactive";
    statusBox.className = "status inactive";
  }
});