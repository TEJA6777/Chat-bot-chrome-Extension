chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'processQuery') {
      chrome.storage.local.get('geminiApiKey', (data) => {
        const apiKey = data.geminiApiKey;
        if (!apiKey) {
          sendResponse({ answer: 'Gemini API Key not set. Please set it in the extension popup.' });
          return;
        }
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const payload = {
          contents: [{
            parts: [{ text: message.query }]
          }]
        };
        
        console.log("Sending payload:", payload);
        
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
          .then(response => {
            console.log("Response status:", response.status);
            return response.json();
          })
          .then(data => {
            console.log("Response data:", data);
            let answerCandidate = data.candidates && data.candidates.length > 0 
              ? data.candidates[0].content 
              : null;
            
            let answer = '';
            if (answerCandidate) {
              if (typeof answerCandidate === 'object' && answerCandidate.parts && Array.isArray(answerCandidate.parts)) {
                answer = answerCandidate.parts.map(part => part.text.trim()).join(" ");
              } else if (typeof answerCandidate === 'object' && answerCandidate.text) {
                answer = answerCandidate.text;
              } else {
                answer = answerCandidate;
              }
            } else {
              answer = 'No answer received.';
            }
            
            sendResponse({ answer: answer });
          })
          .catch(error => {
            console.error('Error fetching from Gemini API:', error);
            sendResponse({ answer: 'Error communicating with Gemini API.' });
          });
      });
      // Indicate that sendResponse will be called asynchronously.
      return true;
    }
  });
  