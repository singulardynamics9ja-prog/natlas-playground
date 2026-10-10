"use client";

import { useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("English");

  const promptTemplates = [
    "Write a business plan for a fintech startup",
    "Translate this text to Yoruba",
    "Generate a professional CV summary",
    "Create a grant proposal outline",
    "Explain AI in simple terms",
  ];

  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Welcome to N-ATLAS Playground. Ask me anything.",
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message,
    };

    const aiMessage = {
      sender: "assistant",
      text: `N-ATLAS Playground received your ${language} prompt: "${message}". Real N-ATLAS responses will be generated here after API integration.`,
    };

    setMessages([...messages, userMessage, aiMessage]);
    setMessage("");
  };

  const newChat = () => {
    setMessages([
      {
        sender: "assistant",
        text: "Welcome to N-ATLAS Playground. Ask me anything.",
      },
    ]);
  };

  const useTemplate = (template: string) => {
    setMessage(template);
  };

  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <aside className="w-72 bg-slate-900 p-4">
        <h2 className="text-xl font-bold mb-6">
          N-ATLAS Playground
        </h2>

        <div className="space-y-3 mb-6">
          <button
            onClick={newChat}
            className="bg-slate-800 p-3 rounded-lg w-full text-left hover:bg-slate-700"
          >
            New Chat
          </button>

          <div className="bg-slate-800 p-3 rounded-lg">
            Prompt Library
          </div>

          <div className="bg-slate-800 p-3 rounded-lg">
            History
          </div>

          <div className="bg-slate-800 p-3 rounded-lg">
            Settings
          </div>
        </div>

        <h3 className="font-bold mb-3">
          Prompt Templates
        </h3>

        <div className="space-y-2">
          {promptTemplates.map((template, index) => (
            <button
              key={index}
              onClick={() => useTemplate(template)}
              className="bg-slate-800 p-2 rounded-lg text-sm w-full text-left hover:bg-slate-700"
            >
              {template}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        <header className="border-b border-slate-800 p-4">
          <h1 className="text-2xl font-bold">
            N-ATLAS Playground
          </h1>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.sender === "user"
                    ? "bg-blue-600 p-4 rounded-xl max-w-xl ml-auto"
                    : "bg-slate-800 p-4 rounded-xl max-w-xl"
                }
              >
                {msg.text}
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-slate-800 p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 p-3 rounded-lg"
            >
              <option>English</option>
              <option>Yoruba</option>
              <option>Hausa</option>
              <option>Igbo</option>
            </select>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Type your prompt..."
              className="flex-1 p-3 rounded-lg bg-slate-800 outline-none"
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 px-6 rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}