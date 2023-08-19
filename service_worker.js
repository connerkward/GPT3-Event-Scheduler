chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "create-gcal-url",
        title: "Create Google Calendar event",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId == "create-gcal-url") {
        chrome.storage.sync.get(["apiKey"], function(result) {
            chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                css: 'body { cursor: wait; }'
            });
            if (result.apiKey === undefined) {
                alert("API key is not set. Please set it in the extension options.");
                chrome.runtime.openOptionsPage();
            } else {
                const apiKey = result.apiKey;
                const endpoint = "https://api.openai.com/v1/completions";

                const now = new Date();
                const localTime = now.toLocaleTimeString();
                const localDate = now.toLocaleDateString();

                const model = "text-davinci-003";
                const prompt = `"""
                Create a Google Calendar link to add an event to Google Calendar based on this text: ${info.selectionText}.
                Take into account that my current local time is ${localTime}, and today is ${localDate}. 
                """`
                const max_tokens = 256;

                fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: model,
                            prompt: prompt,
                            max_tokens: max_tokens
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        const calendarURL = data.choices[0].text;
                        chrome.scripting.insertCSS({
                            target: { tabId: tab.id },
                            css: 'body { cursor: default; }'
                        });
                        chrome.tabs.create({
                            url: calendarURL
                        });
                    });
            }
        });
    }
});