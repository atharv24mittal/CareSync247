// Listening for the user clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked on tab:", tab);
  
    // Send a message to the content script in the active tab
    chrome.tabs.sendMessage(tab.id, { greeting: "Hello from background!" }, (response) => {
      console.log("Response from content script:", response);
    });
  });
  
  // Example of receiving a message from the content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background script:", message);
  
    // Respond to the content script
    sendResponse({ message: "Received your message in background.js!" });
  });
  
