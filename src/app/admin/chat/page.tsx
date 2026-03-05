"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, ArrowLeft, Search } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { useAuth } from "@/context/AuthContext";

type ChatSummary = {
  chatId: string;
  userName: string;
  lastMessage: string;
  lastAt: string;
  lastSender: string;
  messageCount: number;
  unreadCount: number;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    isOnline: boolean;
  } | null;
};

type Message = {
  id: string;
  message: string;
  isAdmin: boolean;
  isRead: boolean;
  createdAt: string;
  user: { name: string | null; role?: string };
};

export default function AdminChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const loadedChatOnceRef = useRef(new Set<string>());

  // Heartbeat for presence
  useEffect(() => {
    if (!user) return;
    
    const heartbeat = () => fetch("/api/users/presence", { method: "POST" });
    heartbeat();
    const interval = setInterval(heartbeat, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [user]);

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
    const chatId = selectedChat;

    function loadMessages() {
      if (!loadedChatOnceRef.current.has(chatId)) setLoadingMessages(true);
      fetch(`/api/chat?chatId=${chatId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        });
    }

    const loadMessagesWithFinally = () =>
      Promise.resolve(loadMessages()).finally(() => {
        loadedChatOnceRef.current.add(chatId);
        setLoadingMessages(false);
      });

    loadMessagesWithFinally();
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

  const sortedChats = [...chats].sort((a, b) => {
    const aUnread = a.unreadCount > 0;
    const bUnread = b.unreadCount > 0;
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
  });

  const filteredChats = sortedChats.filter((chat) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      chat.userName.toLowerCase().includes(s) ||
      chat.lastMessage.toLowerCase().includes(s) ||
      (chat.lastSender ?? "").toLowerCase().includes(s) ||
      (chat.assignedTo?.name ?? "").toLowerCase().includes(s) ||
      (chat.assignedTo?.role ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Customer Chats ({chats.length})
      </h1>

      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-180px)] min-h-[500px]">
        {/* Chat list */}
        <div className={`w-full shrink-0 flex flex-col md:w-72 ${selectedChat ? "hidden md:flex" : "flex"}`}> 
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredChats.length === 0 ? (
              <div className="rounded-xl border border-border bg-white py-16 text-center text-sm text-muted">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted" />
                No customer chats found.
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.chatId}
                  onClick={() => {
                    setSelectedChat(chat.chatId);
                    setMessages([]);
                    setLoadingMessages(true);
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedChat === chat.chatId
                      ? "border-primary bg-primary-light/30 ring-1 ring-primary/20"
                      : "border-border bg-white hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{chat.userName}</p>
                      {chat.assignedTo && (
                        <div className="relative shrink-0" title={`${chat.assignedTo.name} (${chat.assignedTo.role})`}>
                          <div className={`h-2 w-2 rounded-full ${chat.assignedTo.isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {chat.unreadCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                          {chat.unreadCount}
                        </span>
                      )}
                      <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {chat.messageCount}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {chat.lastSender && <span className="font-medium text-primary-dark/60">{chat.lastSender}: </span>}
                    {chat.lastMessage}
                  </p>
                  {chat.assignedTo && (
                    <p className="mt-1 text-[10px] font-medium text-primary/70 italic">
                      Handling: {chat.assignedTo.name.split(' ')[0]}
                    </p>
                  )}
                  <p className="mt-1 text-[9px] text-muted/60">
                    {chat.lastAt ? new Date(chat.lastAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ""}
                  </p>
                </button>
              ))
            )}
          </div>
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
                <div className="ml-auto flex items-center gap-2">
                  {user?.role === "SUPPORT" && (
                    <button
                      onClick={async () => {
                        const confirmRefer = confirm("Refer this conversation to a Pharmacist for medical assistance?");
                        if (!confirmRefer) return;
                        
                        const res = await fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                            message: "⚠️ [SYSTEM] This conversation has been referred to a Pharmacist for medical review.", 
                            chatId: selectedChat 
                          }),
                        });
                        
                        if (res.ok) {
                          alert("Pharmacist has been notified via the chat log.");
                        }
                      }}
                      className="rounded-lg bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      Refer to Pharmacist
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                    <p className="mt-3 text-xs text-muted">Loading chat…</p>
                  </div>
                ) : null}
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
                      {!msg.isAdmin ? (
                        <p className="mb-0.5 text-[10px] font-semibold text-primary">
                          {msg.user.name ?? "Customer"}
                        </p>
                      ) : (
                        <p className="mb-0.5 text-[10px] font-semibold text-white/80">
                          {msg.user.name ?? "Admin"} • {msg.user.role?.replace('_', ' ').toLowerCase() ?? "Staff"}
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
