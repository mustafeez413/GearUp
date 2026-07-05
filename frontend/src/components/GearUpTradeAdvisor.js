"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

export default function GearUpTradeAdvisor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Find me the top 3 soccer ball manufacturers in Sialkot with at least 50k monthly capacity.",
      sender: "user",
    },
    {
      id: 2,
      text: "",
      sender: "bot",
      isHtml: true,
      htmlContent: (
        <>
          <p className="text-sm mb-3">Here are the top matches based on your criteria:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <strong>Elite Sports Ltd:</strong> 120k units/mo • Gold Verified
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <strong>ProBall Industries:</strong> 85k units/mo • ISO 9001
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <strong>TechnoGear Mfg:</strong> 60k units/mo • Export Ready
            </li>
          </ul>
        </>
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: data.data.reply, sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Assistant is temporarily unavailable. Please try again or use the full chat page.",
            sender: "bot",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Could not reach the assistant. Check your connection and API configuration.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section className="py-24 bg-[#022c22] overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white text-sm font-semibold mb-6 backdrop-blur-sm">
            <Sparkles size={16} className="text-emerald-400" />
            <span>GearUp Trade Advisor</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Your personal trade analyst.
          </h2>
          <p className="font-body text-lg text-slate-300 max-w-2xl mx-auto">
            Ask questions about suppliers, pricing trends, or logistics. Get instant, data-backed answers powered by our
            platform intelligence.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={18} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">GearUp Trade Advisor</h4>
              <p className="text-xs text-emerald-400">Online • Live connection</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start gap-4"}`}>
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 h-fit">
                    <Bot className="text-white" size={18} />
                  </div>
                )}
                <div
                  className={`${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]"
                      : "max-w-[85%] space-y-4"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <div className="bg-slate-700/50 border border-slate-600 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm whitespace-pre-wrap">
                      {msg.isHtml ? msg.htmlContent : <p className="text-sm">{msg.text}</p>}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start gap-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 h-fit">
                  <Bot className="text-white" size={18} />
                </div>
                <div className="bg-slate-700/50 border border-slate-600 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center h-10 w-16 justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-700 bg-slate-800/80 shrink-0">
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about suppliers, products, or logistics..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-body"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
