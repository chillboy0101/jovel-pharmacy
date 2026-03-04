"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

type Message = {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user: { name: string | null; role?: string };
};

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    function openChat() { setOpen(true); }
    window.addEventListener("open-chat", openChat);
    return () => window.removeEventListener("open-chat", openChat);
  }, []);

  useEffect(() => {
    if (!open || !isAuthenticated || pathname?.startsWith("/admin")) return;

    function loadMessages() {
      fetch("/api/chat")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setMessages(data);
        });
    }

    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [open, isAuthenticated, pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide chat on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.trim() }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
    }
    setSending(false);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-xl active:scale-95"
          aria-label="Chat with pharmacist"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Chat with a Pharmacist</p>
              <p className="text-[10px] text-white/70">Usually responds within minutes</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="mb-3 h-10 w-10 text-muted" />
              <p className="mb-2 text-sm font-semibold text-foreground">Sign in to chat</p>
              <p className="mb-4 text-xs text-muted">
                You need an account to chat with our pharmacists.
              </p>
              <a
                href="/account"
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Sign In
              </a>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="mb-2 h-8 w-8 text-primary-light" />
                    <p className="text-xs text-muted">
                      Send a message to start chatting with our pharmacist.
                    </p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || `msg-${idx}`}
                    className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        msg.isAdmin
                          ? "rounded-bl-md bg-muted-light text-foreground"
                          : "rounded-br-md bg-primary text-white"
                      }`}
                    >
                      {msg.isAdmin && (
                        <p className="mb-0.5 text-[10px] font-semibold text-primary">
                          Pharmacist
                        </p>
                      )}
                      <p className="leading-relaxed">{msg.message}</p>
                      <p className={`mt-1 text-[9px] ${msg.isAdmin ? "text-muted" : "text-white/60"}`}>
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
                    placeholder="Type a message…"
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
      )}
    </>
  );
}
