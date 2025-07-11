// --- Inject Updated CSS for Chat Overlay ---
const style = document.createElement('style');
style.textContent = `
  .chat-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3); /* Semi-transparent dark overlay */
    z-index: 1001;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .chat-container {
    background: white;
    border-radius: 8px;
    width: 400px;
    max-height: 80%;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  .chat-header {
    background-color: #003366;
    color: white;
    padding: 10px;
    font-size: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  .chat-header button {
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-left: 5px;
  }
  .chat-body {
    padding: 10px;
    overflow-y: auto;
    flex-grow: 1;
    background-color: white;
  }
  .chat-footer {
    display: flex;
    border-top: 1px solid #ADD8E6;
  }
  .chat-input {
    flex-grow: 1;
    border: none;
    padding: 10px;
    font-size: 14px;
    background-color: #F0F8FF;
  }
  .chat-input:focus {
    outline: none;
  }
  .chat-send {
    background-color: #003366;
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
  }
  .chat-send:hover {
    background-color: #002244;
  }
  .chat-message {
    margin: 5px 0;
    padding: 5px 8px;
    border-radius: 4px;
    font-size: 0.95em;
    max-width: 80%;
    word-wrap: break-word;
  }
  .chat-message.user {
    background-color: #ADD8E6;
    color: #003366;
    align-self: flex-end;
  }
  .chat-message.bot {
    background-color: #f8f9fa;
    color: #003366;
    align-self: flex-start;
  }
`;
document.head.appendChild(style);

// --- Unload Detection ---
let isUnloading = false;
window.addEventListener("beforeunload", () => {
  isUnloading = true;
});

// --- Utility Functions ---
// Extract current problem ID from URL (assumes URL like /problems/<problemId>)
function getProblemId() {
  const path = window.location.pathname;
  if (path.startsWith("/problems/")) {
    return path.substring("/problems/".length);
  }
  return "default";
}
const currentProblemId = getProblemId();

// --- Retrieve Code from localStorage ---
// Assumes keys in localStorage follow the format: "course_40398_<problemId>_<language>"
// Note: "40398" is treated here as a unique user ID.
function getCodeFromLocalStorage(problemId, userId = "40398") {
  const editorLanguage = localStorage.getItem("editor-language") || "Java";
  const key = `course_${userId}_${problemId}_${editorLanguage}`;
  const code = localStorage.getItem(key) || "// Write your code here";
  return { editorLanguage, code };
}

// --- Conversation History using localStorage ---
// Chat history is stored under "conversationHistory" as a JSON‑serialized object keyed by problem ID.
function loadConversationHistory() {
  const stored = localStorage.getItem("conversationHistory");
  if (stored) {
    const chatHistories = JSON.parse(stored);
    return chatHistories[currentProblemId] || [];
  }
  return [];
}

function saveConversationHistory(history) {
  const stored = localStorage.getItem("conversationHistory");
  const chatHistories = stored ? JSON.parse(stored) : {};
  chatHistories[currentProblemId] = history;
  localStorage.setItem("conversationHistory", JSON.stringify(chatHistories));
}

let conversationHistory = [];

// --- Helper Function to Check for Greetings ---
function isGreeting(text) {
  const greetings = ["hi", "hello", "hey", "greetings"];
  return greetings.includes(text.trim().toLowerCase());
}

// --- Chat Button Injection ---
function addChatBotButton() {
  if (!onProblemsPage() || document.getElementById("chat-bot-button")) return;
  
  const chatBotButton = document.createElement("img");
  chatBotButton.id = "chat-bot-button";
  chatBotButton.src = chrome.runtime.getURL("assets/logo2.png");
  chatBotButton.style.height = "30px";
  chatBotButton.style.width = "30px";
  
  const askDoubtButton = document.getElementsByClassName("coding_ask_doubt_button__FjwXJ")[0];
  if (!askDoubtButton) return;
  
  askDoubtButton.parentNode.insertAdjacentElement("afterend", chatBotButton);
  chatBotButton.addEventListener("click", openChatBot);
}

function onProblemsPage() {
  return window.location.pathname.startsWith("/problems/");
}

function getProblemDetails() {
  return document.body.innerText.trim();
}

// Observe DOM changes to inject the chat button.
const observer = new MutationObserver(() => {
  addChatBotButton();
});
observer.observe(document.body, { childList: true, subtree: true });
addChatBotButton();

// --- Open Chat Overlay ---
function openChatBot() {
  const extractedText = getProblemDetails();
  conversationHistory = loadConversationHistory();

  // Retrieve code snippet and editor language for current problem.
  const { editorLanguage, code } = getCodeFromLocalStorage(currentProblemId);

  // Create overlay and container.
  const overlay = document.createElement("div");
  overlay.id = "chatBotOverlay";
  overlay.className = "chat-overlay";

  const chatContainer = document.createElement("div");
  chatContainer.className = "chat-container";

  // Header with title and control buttons.
  const header = document.createElement("div");
  header.className = "chat-header";
  const title = document.createElement("span");
  title.innerText = "Coding Assistant";
  header.appendChild(title);

  const headerControls = document.createElement("div");
  const clearButton = document.createElement("button");
  clearButton.innerText = "Clear";
  clearButton.addEventListener("click", () => {
    conversationHistory = [];
    saveConversationHistory(conversationHistory);
    chatBody.innerHTML = "";
  });
  headerControls.appendChild(clearButton);

  const closeButton = document.createElement("button");
  closeButton.innerText = "X";
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  headerControls.appendChild(closeButton);
  header.appendChild(headerControls);
  chatContainer.appendChild(header);

  // Chat body for messages.
  const chatBody = document.createElement("div");
  chatBody.className = "chat-body";
  chatContainer.appendChild(chatBody);

  // Display previous conversation messages.
  conversationHistory.forEach(msg => {
    appendMessage(msg.sender, msg.text);
  });

  // Footer with input field and send button.
  const footer = document.createElement("div");
  footer.className = "chat-footer";
  const chatInput = document.createElement("input");
  chatInput.type = "text";
  chatInput.placeholder = "Type your message...";
  chatInput.className = "chat-input";
  footer.appendChild(chatInput);
  const sendButton = document.createElement("button");
  sendButton.innerText = "Send";
  sendButton.className = "chat-send";
  footer.appendChild(sendButton);
  chatContainer.appendChild(footer);

  overlay.appendChild(chatContainer);
  document.body.appendChild(overlay);

  // Helper function to append messages.
  function appendMessage(sender, text) {
    const messageElem = document.createElement("div");
    messageElem.className = "chat-message " + (sender === "User" ? "user" : "bot");
    messageElem.innerText = sender + ": " + text;
    chatBody.appendChild(messageElem);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Send message on button click or Enter key.
  sendButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  function sendMessage() {
    const userQuery = chatInput.value.trim();
    if (!userQuery) return;
    
    // Save the user's message.
    conversationHistory.push({ sender: "User", text: userQuery });
    saveConversationHistory(conversationHistory);
    appendMessage("User", userQuery);
    chatInput.value = "";

    // --- Intercept query for first non-greeting question ---
    if (userQuery.toLowerCase().includes("what is the first question i asked")) {
      const firstUserMsg = conversationHistory.find(
        msg => msg.sender === "User" && !isGreeting(msg.text)
      );
      let reply = firstUserMsg ? "You asked: " + firstUserMsg.text : "No valid question found.";
      appendMessage("Bot", reply);
      conversationHistory.push({ sender: "Bot", text: reply });
      saveConversationHistory(conversationHistory);
      return;
    }
    // --- End interception for first question ---

    // --- Intercept query for code retrieval ---
    if (
      userQuery.toLowerCase().includes("what is the code that i have written") ||
      userQuery.toLowerCase().includes("give me code that i have written") ||
      userQuery.toLowerCase().includes("what is the code in the code editor") ||
      userQuery.toLowerCase().includes("give me the code")
    ) {
      const placeholder = "// Write your code here";
      let reply = "";
      if (code.trim() === placeholder.trim() || code.trim() === "") {
        reply = "I can't see any code written by you.";
      } else {
        reply = `Here is the code you have written for problem ${currentProblemId} in ${editorLanguage}:\n\n\`\`\`${editorLanguage.toLowerCase()}\n${code}\n\`\`\``;
      }
      appendMessage("Bot", reply);
      conversationHistory.push({ sender: "Bot", text: reply });
      saveConversationHistory(conversationHistory);
      return;
    }
    // --- End interception for code retrieval ---

    // Build the conversation text for the Gemini API query.
    const conversationText = conversationHistory
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join("\n");

    const finalQuery = 
      "Talk normally if it is general talk like hi, who are you, and tell that I am a problem helper if and only if the user talks that way, that's it. " +
      "You are a coding assistant that helps with the coding problem present in the extracted text. " +
      extractedText +
      "\n\nAdditionally, here is the code for problem " + currentProblemId +
      " in " + editorLanguage + ":\n" + code +
      "\n\nBased strictly on the above content, provide a clear, step-by-step solution or explanation for the following query in plain sentences. " +
      "\nConversation History:\n" + conversationText +
      "\nUser Query: " + userQuery;

    chrome.runtime.sendMessage({ type: "processQuery", query: finalQuery }, (response) => {
      if (chrome.runtime.lastError || isUnloading) {
        console.error("Runtime error or page unloading:", chrome.runtime.lastError);
        return;
      }
      if (response && response.answer) {
        appendMessage("Bot", response.answer);
        conversationHistory.push({ sender: "Bot", text: response.answer });
        saveConversationHistory(conversationHistory);
      } else {
        appendMessage("Bot", "Sorry, something went wrong.");
        conversationHistory.push({ sender: "Bot", text: "Sorry, something went wrong." });
        saveConversationHistory(conversationHistory);
      }
    });
  }
}
