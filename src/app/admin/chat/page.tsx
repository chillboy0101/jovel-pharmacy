"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import PageLoader from "@/components/PageLoader";

type ChatSummary = {
  chatId: string;
  userName: string;
  lastMessage: string;
  lastAt: string;
  messageCount: number;
};

type Message = {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user: { name: string | null; role?: string };
};

export default function AdminChatPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Load chat list
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setChats(data);
        setLoading(false);
      });

    const interval = setInterval(() => {
      fetch("/api/chat")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setChats(data);
        });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    function loadMessages() {
      fetch(`/api/chat?chatId=${selectedChat}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        });
    }

    loadMessages();
    pollRef.current = setInterval(loadMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || !selectedChat) return;
    setSending(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.trim(), chatId: selectedChat }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
    }
    setSending(false);
  }

  if (loading) return <PageLoader text="Loading chats…" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Customer Chats ({chats.length})
      </h1>

      <div className="flex gap-6" style={{ minHeight: 500 }}>
        {/* Chat list */}
        <div className={`w-full shrink-0 space-y-2 md:w-72 ${selectedChat ? "hidden md:block" : ""}`}>
          {chats.length === 0 ? (
            <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted" />
              No customer chats yet.
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.chatId}
                onClick={() => setSelectedChat(chat.chatId)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  selectedChat === chat.chatId
                    ? "border-primary bg-primary-light/30"
                    : "border-border bg-white hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{chat.userName}</p>
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {chat.messageCount}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted">{chat.lastMessage}</p>
                <p className="mt-1 text-[10px] text-muted/60">
                  {chat.lastAt ? new Date(chat.lastAt).toLocaleString() : ""}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Chat window */}
        <div className={`flex flex-1 flex-col rounded-xl border border-border bg-white overflow-hidden ${!selectedChat ? "hidden md:flex" : "flex"}`}>
          {!selectedChat ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-muted" />
              <p className="text-sm text-muted">Select a conversation to reply</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border bg-muted-light px-4 py-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden rounded-lg p-1 text-muted hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                  {(chats.find((c) => c.chatId === selectedChat)?.userName ?? "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {chats.find((c) => c.chatId === selectedChat)?.userName ?? "Customer"}
                  </p>
                  <p className="text-[10px] text-muted">
                    {messages.length} messages
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        msg.isAdmin
                          ? "rounded-br-md bg-primary text-white"
                          : "rounded-bl-md bg-muted-light text-foreground"
                      }`}
                    >
                      {!msg.isAdmin && (
                        <p className="mb-0.5 text-[10px] font-semibold text-primary">
                          {msg.user.name ?? "Customer"}
                        </p>
                      )}
                      <p className="leading-relaxed">{msg.message}</p>
                      <p className={`mt-1 text-[9px] ${msg.isAdmin ? "text-white/60" : "text-muted"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="border-t border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Reply to customer…"
                    className="flex-1 rounded-xl border border-border bg-muted-light px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
