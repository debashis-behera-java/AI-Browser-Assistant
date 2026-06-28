const API_KEY = "YOUR_API_KEY";

// Load previous chat history
let chatHistory =
  JSON.parse(localStorage.getItem("chatHistory")) || [];

// Render chat messages
function renderChat() {

  const chatContainer =
    document.getElementById("chatContainer");

  chatContainer.innerHTML = "";

  chatHistory.forEach(chat => {

    const message = `
    <div class="message">

      <div class="user">
        <strong>🧑 You</strong><br><br>
        ${chat.question}
      </div>

      <div class="ai">
        <strong>🤖 AI Assistant</strong><br><br>
        ${chat.answer}
      </div>

    </div>
  `;

    chatContainer.insertAdjacentHTML(
      "beforeend",
      message
    );
  });

  chatContainer.scrollTop =
    chatContainer.scrollHeight;
}

// Load old messages when popup opens
if (chatHistory.length) {
  renderChat();
}

// Call OpenAI API
async function askAI(prompt) {

  try {

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    console.log(data);

    if (data.error) {
      return "❌ Gemini Error: " + data.error.message;
    }

    if (
      !data.candidates ||
      !data.candidates.length
    ) {

      console.log("Gemini Response:", data);

      return "❌ Gemini returned an empty response.";
    }

    return data.candidates[0].content.parts[0].text;

  } catch (error) {

    return "❌ Network Error: " + error.message;
  }
}

// ASK AI BUTTON
document
  .getElementById("askBtn")
  .addEventListener("click", async () => {

    const input =
      document.getElementById("input").value.trim();

    if (!input) return;

    const askBtn =
      document.getElementById("askBtn");

    askBtn.disabled = true;
    askBtn.innerText = "⏳ Thinking...";

    try {

      const reply = await askAI(input);

      chatHistory.push({
        question: input,
        answer: reply
      });

      localStorage.setItem(
        "chatHistory",
        JSON.stringify(chatHistory)
      );

      renderChat();

      document.getElementById("input").value = "";

    } catch (error) {

      console.error(error);

      chatHistory.push({
        question: input,
        answer: "❌ Something went wrong."
      });

      renderChat();

    } finally {

      askBtn.disabled = false;
      askBtn.innerText = "🚀 Ask AI";
    }

  });

// SUMMARIZE PAGE BUTTON
document
  .getElementById("summaryBtn")
  .addEventListener("click", async () => {

    const [tab] =
      await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

    chrome.scripting.executeScript({

      target: {
        tabId: tab.id
      },

      func: () => document.body.innerText

    }, async (results) => {

      if (
        chrome.runtime.lastError ||
        !results ||
        !results.length
      ) {

        alert(
          "Cannot summarize this page. Open a normal website."
        );

        return;
      }

      const pageText = results[0].result || "";

      const chatContainer =
        document.getElementById("chatContainer");

      chatContainer.innerHTML += `
        <div class="loading">
          📄 Reading webpage...
        </div>
      `;

      const summary = await askAI(
        "Summarize this:\n" +
        pageText.slice(0, 3000)
      );

      chatHistory.push({
        question: "📄 Summarize Current Page",
        answer: summary
      });

      localStorage.setItem(
        "chatHistory",
        JSON.stringify(chatHistory)
      );

      renderChat();
    });

  });

// ENTER KEY SUPPORT
document
  .getElementById("input")
  .addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();

      document
        .getElementById("askBtn")
        .click();
    }

  });

// CLEAR CHAT BUTTON
document
  .getElementById("clearBtn")
  .addEventListener("click", () => {

    chatHistory = [];

    localStorage.removeItem("chatHistory");

    document.getElementById("chatContainer").innerHTML = `
      <div class="message">
        <div class="ai">
          🤖 Welcome! Ask me anything.
        </div>
      </div>
    `;
  });