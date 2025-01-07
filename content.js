// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content script:", message);
  
    // Example: Modify the webpage's DOM
    if (message.greeting === "Hello from background!") {
      document.body.style.backgroundColor = "lightblue";
    }
  
    // Send a response back to the background script
    sendResponse({ message: "Content script received the message!" });
  });
  
  // Example: Send a message to the background script
  chrome.runtime.sendMessage({ greeting: "Hello from content.js!" }, (response) => {
    console.log("Response from background script:", response);
  });
  
