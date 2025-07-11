document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const editButton = document.getElementById('editApiKey');
  const saveButton = document.getElementById('saveApiKey');
  const statusText = document.getElementById('status');

  // Retrieve and display the current API key, if any.
  chrome.storage.local.get('geminiApiKey', (data) => {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
      apiKeyInput.setAttribute('readonly', true);
      statusText.innerText = 'API Key loaded.';
    } else {
      apiKeyInput.removeAttribute('readonly');
      statusText.innerText = 'Please enter your API key.';
    }
  });

  // Edit button toggles the input field's readonly state.
  editButton.addEventListener('click', () => {
    if (apiKeyInput.hasAttribute('readonly')) {
      apiKeyInput.removeAttribute('readonly');
      apiKeyInput.focus();
      statusText.innerText = 'You can now edit the API key.';
    } else {
      apiKeyInput.setAttribute('readonly', true);
      statusText.innerText = 'Editing disabled.';
    }
  });

  // Save the API key when the Save button is clicked.
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        apiKeyInput.setAttribute('readonly', true);
        statusText.innerText = 'API Key saved successfully!';
      });
    } else {
      statusText.innerText = 'Please enter a valid API key.';
    }
  });
});
