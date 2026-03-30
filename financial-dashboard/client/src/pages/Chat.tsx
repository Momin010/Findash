import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User } from "lucide-react";
import { chatApi } from "../lib/api";
import { cn } from "../lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI financial assistant. Ask me anything about budgeting, saving strategies, investment advice, or financial planning. How can I help you today?",
      sender: 'ai'
    }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput("");

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionRes = await chatApi.createSession("New Chat");
        currentSessionId = sessionRes.data.id;
        setSessionId(currentSessionId);
      }

      const res = await chatApi.sendMessage(currentSessionId, userText);
      const aiResponse = res.data?.assistantMessage?.content || "I'm sorry, I couldn't process that request.";

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai'
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again later.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
        <p className="text-slate-500 mt-1">Get personalized financial advice</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-4 max-w-[80%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.sender === 'user' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
              )}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.sender === 'user'
                  ? "bg-[#4f46e5] text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about budgeting, saving, investing..."
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white" />
            <button type="submit" disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 text-white bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 disabled:hover:bg-[#8b5cf6] rounded-lg transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
