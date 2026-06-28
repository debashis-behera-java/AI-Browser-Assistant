const API_KEY = "YOUR_API_KEY";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainText",
    title: "Explain with AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {

  if (info.menuItemId !== "explainText") return;

  try {

    const selectedText = info.selectionText;

    const res = await fetch(
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
                  text:
                    "Explain this in simple words:\n\n" +
                    selectedText
                }
              ]
            }
          ]
        })
      }
    );

    const data = await res.json();

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate response.";

    chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },

      func: (text) => {
        alert(text);
      },

      args: [answer]
    });

  } catch (error) {

    chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },

      func: (text) => {
        alert(text);
      },

      args: [
        "❌ Error: " + error.message
      ]
    });
  }

});