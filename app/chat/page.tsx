"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  getSupabaseAccessToken,
  isSupabaseConfigured,
  supabaseRequest,
} from "@/lib/supabase";

type Language = "English" | "Yoruba" | "Hausa" | "Igbo";
type Sender = "user" | "assistant";

type ChatMessage = {
  id: string;
  sender: Sender;
  content: string;
  timestamp: string;
  isDemo?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

const languages: Language[] = ["English", "Yoruba", "Hausa", "Igbo"];
const promptTemplates = [
  "Write a business plan for a fintech startup",
  "Translate this text to Yoruba",
  "Translate this text to Hausa",
  "Translate this text to Igbo",
  "Generate a professional CV summary",
  "Create a grant proposal outline",
  "Write a funding pitch for investors",
  "Explain AI in simple terms",
  "Create a marketing strategy for a Nigerian startup",
  "Generate a product requirements document",
];

function newId() {
  return crypto.randomUUID();
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("English");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [persistenceStatus, setPersistenceStatus] = useState("Connecting to workspace…");
  const [feedback, setFeedback] = useState<
    Record<string, { helpful: boolean; accuracy: number; relevance: number; saved: boolean }>
  >({});
  const messageEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setPersistenceStatus("Demo mode · chats are not saved");
      return;
    }

    const rows = await supabaseRequest<Conversation[]>(
      "conversations?select=id,title,created_at&order=created_at.desc",
    );
    setConversations(rows);
    setPersistenceStatus("Workspace synced");
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await loadConversations();
      } catch (error) {
        if (active) {
          setPersistenceStatus("Workspace unavailable");
          setNotice(error instanceof Error ? error.message : "Could not load your workspace.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  async function openConversation(conversation: Conversation) {
    setNotice("");
    setIsLoading(true);
    setSidebarOpen(false);

    try {
      const rows = await supabaseRequest<ChatMessage[]>(
        `messages?select=id,sender,content,timestamp&conversation_id=eq.${encodeURIComponent(conversation.id)}&order=timestamp.asc`,
      );
      setConversationId(conversation.id);
      setMessages(rows);
      setFeedback({});
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not open this conversation.");
    } finally {
      setIsLoading(false);
    }
  }

  function newChat() {
    if (isTyping) return;
    setConversationId(null);
    setMessages([]);
    setFeedback({});
    setNotice("");
    setSidebarOpen(false);
    composerRef.current?.focus();
  }

  function applyTemplate(template: string) {
    setMessage(template);
    setSidebarOpen(false);
    composerRef.current?.focus();
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = message.trim();
    if (!content || isTyping) return;

    setMessage("");
    setNotice("");
    setIsTyping(true);
    let activeConversationId = conversationId;

    try {
      if (isSupabaseConfigured() && !activeConversationId) {
        const created = await supabaseRequest<Conversation[]>("conversations?select=id,title,created_at", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ title: content.slice(0, 72) }),
        });
        activeConversationId = created[0]?.id;
        if (!activeConversationId) throw new Error("The new conversation could not be saved.");
        setConversationId(activeConversationId);
        setConversations((current) => [
          {
            id: activeConversationId!,
            title: content.slice(0, 72),
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
      }

      const userMessage: ChatMessage = {
        id: newId(),
        sender: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((current) => [...current, userMessage]);
      if (isSupabaseConfigured() && activeConversationId) {
        await supabaseRequest("messages", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            id: userMessage.id,
            conversation_id: activeConversationId,
            sender: userMessage.sender,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
          }),
        });
      }

      const accessToken = isSupabaseConfigured() ? await getSupabaseAccessToken() : null;
      if (!accessToken) {
        if (isSupabaseConfigured()) {
          throw new Error("Could not create a Supabase session. Enable anonymous sign-ins and try again.");
        }

        setMessages((current) => [
          ...current,
          {
            id: newId(),
            sender: "assistant",
            content:
              "Local demo only — no N-ATLAS model is connected, so this is not a generated answer. Configure Supabase and a model endpoint to receive real responses.",
            timestamp: new Date().toISOString(),
            isDemo: true,
          },
        ]);
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .slice(-30)
            .map(({ sender, content: messageContent }) => ({
              role: sender,
              content: messageContent,
            })),
          language,
        }),
      });
      const result = (await response.json()) as { response?: string; error?: string; code?: string };
      if (result.code === "MODEL_NOT_CONFIGURED") {
        setMessages((current) => [
          ...current,
          {
            id: newId(),
            sender: "assistant",
            content:
              "Local demo only — no N-ATLAS model is connected, so this is not a generated answer. Configure a model endpoint to receive real responses.",
            timestamp: new Date().toISOString(),
            isDemo: true,
          },
        ]);
        return;
      }
      if (!response.ok) {
        throw new Error(result.error ?? `The model request failed (${response.status}).`);
      }
      if (!result.response?.trim()) throw new Error("The model returned an empty response.");

      const assistantMessage: ChatMessage = {
        id: newId(),
        sender: "assistant",
        content: result.response.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((current) => [...current, assistantMessage]);
      if (isSupabaseConfigured() && activeConversationId) {
        await supabaseRequest("messages", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            id: assistantMessage.id,
            conversation_id: activeConversationId,
            sender: assistantMessage.sender,
            content: assistantMessage.content,
            timestamp: assistantMessage.timestamp,
          }),
        });
      }

      if (activeConversationId) {
        setConversations((current) => {
          const existing = current.find((item) => item.id === activeConversationId);
          const updated = existing
            ? { ...existing, title: existing.title || content.slice(0, 72) }
            : {
                id: activeConversationId!,
                title: content.slice(0, 72),
                created_at: new Date().toISOString(),
              };
          return [updated, ...current.filter((item) => item.id !== activeConversationId)];
        });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your message could not be sent.");
    } finally {
      setIsTyping(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function saveFeedback(messageId: string, helpful: boolean) {
    const current = feedback[messageId] ?? {
      helpful,
      accuracy: 3,
      relevance: 3,
      saved: false,
    };
    const next = { ...current, helpful };
    setFeedback((items) => ({ ...items, [messageId]: next }));

    if (!isSupabaseConfigured()) {
      setNotice("Configure Supabase to save response feedback.");
      return;
    }

    try {
      const token = await getSupabaseAccessToken();
      if (!token) throw new Error("Sign in to your Supabase workspace to save feedback.");
      await supabaseRequest(
        "feedback?on_conflict=message_id,user_id",
        {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify({
            message_id: messageId,
            helpful: next.helpful,
            accuracy_rating: next.accuracy,
            relevance_rating: next.relevance,
          }),
        },
        token,
      );
      setFeedback((items) => ({ ...items, [messageId]: { ...next, saved: true } }));
      setNotice("Thanks — your feedback was saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feedback could not be saved.");
    }
  }

  async function updateRating(
    messageId: string,
    field: "accuracy" | "relevance",
    value: number,
  ) {
    const current = feedback[messageId] ?? {
      helpful: true,
      accuracy: 3,
      relevance: 3,
      saved: false,
    };
    const next = { ...current, [field]: value, saved: false };
    setFeedback((items) => ({ ...items, [messageId]: next }));

    if (!isSupabaseConfigured()) return;
    try {
      const token = await getSupabaseAccessToken();
      if (!token) throw new Error("Sign in to your Supabase workspace to save feedback.");
      await supabaseRequest(
        "feedback?on_conflict=message_id,user_id",
        {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({
            message_id: messageId,
            helpful: next.helpful,
            accuracy_rating: next.accuracy,
            relevance_rating: next.relevance,
          }),
        },
        token,
      );
      setFeedback((items) => ({ ...items, [messageId]: { ...next, saved: true } }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feedback could not be saved.");
    }
  }

  const sidebar = (
    <aside className="flex h-full w-[min(19rem,88vw)] shrink-0 flex-col border-r border-white/[0.07] bg-[#0b0e13]">
      <div className="flex items-center justify-between px-5 pb-6 pt-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">
            N
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-white">N-ATLAS</span>
            <span className="block text-[11px] text-slate-500">Playground</span>
          </span>
        </Link>
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <div className="px-4">
        <button
          onClick={newChat}
          disabled={isTyping}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.07]"
        >
          <span className="text-lg leading-none text-cyan-300">+</span> New chat
        </button>
      </div>

      <div className="mt-7 min-h-0 flex-1 overflow-y-auto px-4 pb-5">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Prompt templates
          </h2>
          <span className="text-[10px] text-slate-600">{promptTemplates.length}</span>
        </div>
        <div className="space-y-1">
          {promptTemplates.map((template) => (
            <button
              key={template}
              onClick={() => applyTemplate(template)}
              className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] leading-5 text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-100"
            >
              {template}
            </button>
          ))}
        </div>

        <div className="mb-3 mt-8 flex items-center justify-between px-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Recent chats
          </h2>
          <span className="text-[10px] text-slate-600">{conversations.length}</span>
        </div>
        {conversations.length ? (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => void openConversation(conversation)}
                disabled={isTyping}
                className={`w-full truncate rounded-lg px-2.5 py-2 text-left text-xs transition ${
                  conversation.id === conversationId
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                }`}
              >
                {conversation.title}
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2.5 text-xs leading-5 text-slate-600">
            Your saved conversations will appear here.
          </p>
        )}
      </div>

      <div className="border-t border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              persistenceStatus === "Workspace synced" ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span className="text-[11px] text-slate-500">{persistenceStatus}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <main className="flex h-dvh overflow-hidden bg-[#080a0e] text-slate-100">
      <div className="hidden md:block">{sidebar}</div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            className="absolute inset-0 bg-black/65"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative z-10">{sidebar}</div>
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">Chat playground</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">Experiment with N-ATLAS</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Response language</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="rounded-lg border border-white/[0.09] bg-[#11151c] px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-300/50"
              aria-label="Response language"
            >
              {languages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Loading your workspace…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center py-10">
                <div className="mb-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.08] text-lg font-bold text-cyan-200">
                    N
                  </div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.19em] text-cyan-200/80">
                    Multilingual AI, made to build
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    What are you working on?
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                    Explore prompts in English, Yoruba, Hausa, and Igbo. Choose a starting point or
                    write your own.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {promptTemplates.slice(0, 4).map((template) => (
                    <button
                      key={template}
                      onClick={() => applyTemplate(template)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 text-left text-xs leading-5 text-slate-300 transition hover:border-cyan-200/25 hover:bg-cyan-200/[0.04]"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-7 pb-6">
                {messages.map((item) => (
                  <article
                    key={item.id}
                    className={`flex gap-3 ${item.sender === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                        item.sender === "user"
                          ? "bg-slate-700 text-white"
                          : "border border-cyan-200/15 bg-cyan-200/[0.08] text-cyan-100"
                      }`}
                    >
                      {item.sender === "user" ? "YOU" : "N"}
                    </div>
                    <div className={`min-w-0 max-w-[min(85%,42rem)] ${item.sender === "user" ? "text-right" : ""}`}>
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                        {item.sender === "user" ? (
                          <>
                            <time>{formatTime(item.timestamp)}</time>
                            <span>You</span>
                          </>
                        ) : (
                          <>
                              <span className="text-slate-300">
                                {item.isDemo ? "Demo preview" : "N-ATLAS"}
                              </span>
                            <time>{formatTime(item.timestamp)}</time>
                          </>
                        )}
                      </div>
                      <div
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-left text-sm leading-7 ${
                          item.sender === "user"
                            ? "rounded-tr-md bg-[#19232e] text-slate-100"
                            : "rounded-tl-md border border-white/[0.06] bg-[#10141b] text-slate-200"
                        }`}
                      >
                        {item.content}
                      </div>
                      {item.sender === "assistant" && !item.isDemo && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="mr-1 text-slate-600">Was this useful?</span>
                          <button
                            onClick={() => void saveFeedback(item.id, true)}
                            aria-label="Helpful response"
                            className={`rounded-md border px-2 py-1 transition ${
                              feedback[item.id]?.helpful
                                ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200"
                                : "border-white/[0.08] text-slate-500 hover:text-slate-200"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => void saveFeedback(item.id, false)}
                            aria-label="Unhelpful response"
                            className={`rounded-md border px-2 py-1 transition ${
                              feedback[item.id]?.helpful === false
                                ? "border-rose-300/25 bg-rose-300/[0.08] text-rose-200"
                                : "border-white/[0.08] text-slate-500 hover:text-slate-200"
                            }`}
                          >
                            No
                          </button>
                          <label className="ml-2 flex items-center gap-1.5 text-slate-500">
                            Accuracy
                            <select
                              value={feedback[item.id]?.accuracy ?? 3}
                              onChange={(event) =>
                                void updateRating(item.id, "accuracy", Number(event.target.value))
                              }
                              className="rounded border border-white/[0.08] bg-[#10141b] px-1.5 py-1 text-slate-300"
                              aria-label="Rate accuracy from 1 to 5"
                            >
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <option key={rating} value={rating}>{rating}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex items-center gap-1.5 text-slate-500">
                            Relevance
                            <select
                              value={feedback[item.id]?.relevance ?? 3}
                              onChange={(event) =>
                                void updateRating(item.id, "relevance", Number(event.target.value))
                              }
                              className="rounded border border-white/[0.08] bg-[#10141b] px-1.5 py-1 text-slate-300"
                              aria-label="Rate relevance from 1 to 5"
                            >
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <option key={rating} value={rating}>{rating}</option>
                              ))}
                            </select>
                          </label>
                          {feedback[item.id]?.saved && (
                            <span className="text-emerald-300">Saved</span>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {isTyping && (
                  <div className="flex gap-3" role="status" aria-live="polite">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-200/[0.08] text-[11px] font-bold text-cyan-100">
                      N
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#10141b] px-4 py-3.5">
                      <span className="flex gap-1.5">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-200/70"
                            style={{ animationDelay: `${dot * 180}ms` }}
                          />
                        ))}
                      </span>
                      <span className="sr-only">N-ATLAS is responding</span>
                    </div>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/[0.07] px-4 pb-4 pt-3 sm:px-8 sm:pb-6">
          <div className="mx-auto max-w-3xl">
            {notice && (
              <div
                role="status"
                className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-amber-300/15 bg-amber-200/[0.05] px-3 py-2.5 text-xs leading-5 text-amber-100/90"
              >
                <span>{notice}</span>
                <button
                  onClick={() => setNotice("")}
                  className="shrink-0 text-amber-100/60 hover:text-amber-100"
                  aria-label="Dismiss notice"
                >
                  ✕
                </button>
              </div>
            )}
            <form
              onSubmit={(event) => void sendMessage(event)}
              className="rounded-2xl border border-white/[0.1] bg-[#11151c] p-2 shadow-[0_12px_50px_rgba(0,0,0,0.25)] focus-within:border-cyan-200/25"
            >
              <textarea
                ref={composerRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message N-ATLAS…"
                rows={2}
                maxLength={8000}
                disabled={isTyping || isLoading}
                className="max-h-40 min-h-12 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:opacity-60"
                aria-label="Message N-ATLAS"
              />
              <div className="flex items-center justify-between px-1 pb-0.5">
                <span className="px-2 text-[10px] text-slate-600">
                  Enter to send · Shift + Enter for a new line
                </span>
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping || isLoading}
                  className="flex h-9 items-center gap-2 rounded-xl bg-cyan-200 px-4 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isTyping ? "Sending…" : "Send"} <span aria-hidden="true">↑</span>
                </button>
              </div>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              N-ATLAS can make mistakes. Review important information.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
