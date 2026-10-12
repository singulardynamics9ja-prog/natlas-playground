"use client";

import Link from "next/link";
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getSupabaseAccessToken,
  isSupabaseConfigured,
  supabaseRequest,
} from "@/lib/supabase";
import { removeStoredRecordKeys } from "@/lib/chat-storage.mjs";

type Language = "English" | "Yoruba" | "Hausa" | "Igbo";
type Sender = "user" | "assistant";

type ChatMessage = {
  id: string;
  sender: Sender;
  content: string;
  timestamp: string;
  storageStatus?: "saving" | "saved" | "not-saved";
  isDemo?: boolean;
  evaluationCaseId?: string;
  responseLanguage?: Language;
  durationMs?: number;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

type MessageFeedback = {
  helpful: boolean;
  helpfulRated: boolean;
  accuracy: number;
  relevance: number;
  accuracyRated: boolean;
  relevanceRated: boolean;
  saved: boolean;
  workspaceSaved?: boolean;
};

type EvaluationCase = {
  id: string;
  title: string;
  language: Language;
  prompt: string;
  reviewFocus: string;
};

type EvaluationMetadata = {
  caseId: string;
  language: Language;
  durationMs: number;
};

const feedbackStorageKey = "natlas-playground-feedback";
const evaluationStorageKey = "natlas-playground-evaluation-metadata";
const languageStorageKey = "natlas-playground-response-language";
const languagePreferenceEvent = "natlas-language-preference-change";
const languages: Language[] = ["English", "Yoruba", "Hausa", "Igbo"];
const supportedLanguageSet = new Set<string>(languages);
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
const evaluationCases: EvaluationCase[] = [
  {
    id: "yoruba-welcome-translation",
    title: "Yoruba translation",
    language: "Yoruba",
    prompt: "Translate “Welcome to Nigeria” into Yoruba.",
    reviewFocus: "Meaning, natural phrasing, and correct Yoruba orthography.",
  },
  {
    id: "hausa-welcome-translation",
    title: "Hausa translation",
    language: "Hausa",
    prompt: "Translate “Welcome to Nigeria” into Hausa.",
    reviewFocus: "Meaning, natural phrasing, and Hausa orthography.",
  },
  {
    id: "igbo-welcome-translation",
    title: "Igbo translation",
    language: "Igbo",
    prompt: "Translate “Welcome to Nigeria” into Igbo.",
    reviewFocus: "Meaning, natural phrasing, and Igbo orthography.",
  },
  {
    id: "english-ai-explanation",
    title: "Student-friendly AI explanation",
    language: "English",
    prompt: "Explain AI to a secondary school student.",
    reviewFocus: "Clarity, age-appropriate language, and a useful example.",
  },
  {
    id: "english-fintech-business-plan",
    title: "Fintech business plan",
    language: "English",
    prompt: "Create a fintech startup business plan.",
    reviewFocus: "Practicality, structure, and relevance to Nigerian customers.",
  },
  {
    id: "english-grant-proposal",
    title: "Grant proposal outline",
    language: "English",
    prompt: "Generate a grant proposal outline.",
    reviewFocus: "Completeness, clarity, and actionable sections.",
  },
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

function readStoredFeedback(): {
  feedback: Record<string, MessageFeedback>;
  warning: string;
} {
  if (typeof window === "undefined") return { feedback: {}, warning: "" };

  try {
    const stored = localStorage.getItem(feedbackStorageKey);
    if (!stored) return { feedback: {}, warning: "" };

    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Stored feedback has an invalid format.");
    }

    const restored: Record<string, MessageFeedback> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (
        typeof value === "object" &&
        value !== null &&
        "helpful" in value &&
        typeof value.helpful === "boolean" &&
        "accuracy" in value &&
        typeof value.accuracy === "number" &&
        "relevance" in value &&
        typeof value.relevance === "number"
      ) {
        restored[id] = {
          helpful: value.helpful,
          helpfulRated:
            "helpfulRated" in value && typeof value.helpfulRated === "boolean"
              ? value.helpfulRated
              : false,
          accuracy: value.accuracy,
          relevance: value.relevance,
          accuracyRated:
            "accuracyRated" in value && typeof value.accuracyRated === "boolean"
              ? value.accuracyRated
              : false,
          relevanceRated:
            "relevanceRated" in value && typeof value.relevanceRated === "boolean"
              ? value.relevanceRated
              : false,
          saved: true,
        };
      }
    }
    return { feedback: restored, warning: "" };
  } catch (error) {
    return {
      feedback: {},
      warning:
        error instanceof Error ? error.message : "Local response feedback could not be loaded.",
    };
  }
}

function readStoredEvaluationMetadata(): Record<string, EvaluationMetadata> {
  const stored = localStorage.getItem(evaluationStorageKey);
  if (!stored) return {};

  const parsed: unknown = JSON.parse(stored);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Stored evaluation metadata has an invalid format.");
  }

  const restored: Record<string, EvaluationMetadata> = {};
  for (const [messageId, value] of Object.entries(parsed)) {
    if (
      typeof value === "object" &&
      value !== null &&
      "caseId" in value &&
      typeof value.caseId === "string" &&
      evaluationCases.some((evaluationCase) => evaluationCase.id === value.caseId) &&
      "language" in value &&
      isLanguage(value.language) &&
      "durationMs" in value &&
      typeof value.durationMs === "number" &&
      Number.isFinite(value.durationMs) &&
      value.durationMs >= 0
    ) {
      restored[messageId] = {
        caseId: value.caseId,
        language: value.language,
        durationMs: value.durationMs,
      };
    }
  }
  return restored;
}

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && supportedLanguageSet.has(value);
}

function subscribeLanguagePreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(languagePreferenceEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(languagePreferenceEvent, onChange);
  };
}

function getLanguagePreference(): Language {
  const stored = localStorage.getItem(languageStorageKey);
  return isLanguage(stored) ? stored : "English";
}

function getServerLanguagePreference(): Language {
  return "English";
}

function monotonicNow() {
  return performance.now();
}

export default function ChatPage() {
  const [initialFeedback] = useState(readStoredFeedback);
  const [message, setMessage] = useState("");
  const language = useSyncExternalStore(
    subscribeLanguagePreference,
    getLanguagePreference,
    getServerLanguagePreference,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEvaluationCaseId, setSelectedEvaluationCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [retryMessageId, setRetryMessageId] = useState<string | null>(null);
  const [notice, setNotice] = useState(initialFeedback.warning);
  const [persistenceStatus, setPersistenceStatus] = useState("Connecting to workspace…");
  const [feedback, setFeedback] = useState<Record<string, MessageFeedback>>(
    initialFeedback.feedback,
  );
  const messageEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const languageSelectRef = useRef<HTMLSelectElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (settingsOpen) settingsCloseRef.current?.focus();
  }, [settingsOpen]);

  function persistFeedbackLocally(messageId: string, value: MessageFeedback) {
    try {
      const stored = localStorage.getItem(feedbackStorageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : {};
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Stored feedback has an invalid format.");
      }
      localStorage.setItem(
        feedbackStorageKey,
        JSON.stringify({ ...parsed, [messageId]: value }),
      );
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Response feedback could not be saved locally.",
      );
      return false;
    }
  }

  function persistEvaluationMetadata(messageId: string, value: EvaluationMetadata) {
    try {
      const metadata = readStoredEvaluationMetadata();
      localStorage.setItem(
        evaluationStorageKey,
        JSON.stringify({ ...metadata, [messageId]: value }),
      );
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Evaluation details could not be saved on this device.",
      );
      return false;
    }
  }

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
      let metadata: Record<string, EvaluationMetadata> = {};
      try {
        metadata = readStoredEvaluationMetadata();
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Evaluation details could not be loaded from this device.",
        );
      }
      setConversationId(conversation.id);
      setMessages(
        rows.map((item) => ({
          ...item,
          storageStatus: "saved",
          evaluationCaseId: metadata[item.id]?.caseId,
          responseLanguage: metadata[item.id]?.language,
          durationMs: metadata[item.id]?.durationMs,
        })),
      );
      setSelectedEvaluationCaseId(null);

      if (rows.length) {
        try {
          const savedFeedback = await supabaseRequest<
            Array<{
              message_id: string;
              helpful: boolean;
              accuracy_rating: number;
              relevance_rating: number;
            }>
          >(
            `feedback?select=message_id,helpful,accuracy_rating,relevance_rating&message_id=in.(${rows
              .map((item) => encodeURIComponent(item.id))
              .join(",")})`,
          );
          const restored = Object.fromEntries(
            savedFeedback.map((item) => [
              item.message_id,
              {
                helpful: item.helpful,
                helpfulRated: true,
                accuracy: item.accuracy_rating,
                relevance: item.relevance_rating,
                accuracyRated: true,
                relevanceRated: true,
                saved: true,
                workspaceSaved: true,
              },
            ]),
          );
          setFeedback((current) => ({ ...current, ...restored }));
        } catch (error) {
          setNotice(
            error instanceof Error
              ? `Conversation loaded, but saved feedback could not be restored: ${error.message}`
              : "Conversation loaded, but saved feedback could not be restored.",
          );
        }
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not open this conversation.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteConversation(conversation: Conversation) {
    const confirmed = window.confirm(
      "Delete this conversation and its messages and feedback from the workspace? Local feedback and judge metadata for these messages will also be removed. This cannot be undone.",
    );
    if (!confirmed) return;

    setNotice("");
    try {
      const conversationMessages = await supabaseRequest<Array<{ id: string }>>(
        `messages?select=id&conversation_id=eq.${encodeURIComponent(conversation.id)}`,
      );
      const messageIds = conversationMessages.map((item) => item.id);
      await supabaseRequest(
        `conversations?id=eq.${encodeURIComponent(conversation.id)}`,
        { method: "DELETE" },
      );
      const removedIds = new Set(messageIds);
      setFeedback((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => !removedIds.has(id))),
      );
      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      if (conversationId === conversation.id) {
        setConversationId(null);
        setMessages([]);
      }
      try {
        removeStoredRecordKeys(localStorage, feedbackStorageKey, messageIds);
        removeStoredRecordKeys(localStorage, evaluationStorageKey, messageIds);
        setNotice("Conversation and its messages, feedback, and evaluation data were deleted.");
      } catch (error) {
        setNotice(
          error instanceof Error
            ? `Workspace conversation deleted, but some local feedback or evaluation data could not be cleared: ${error.message}`
            : "Workspace conversation deleted, but some local browser data could not be cleared.",
        );
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The conversation could not be deleted.");
    }
  }

  function newChat() {
    if (isTyping) return;
    setConversationId(null);
    setMessages([]);
    setRetryMessageId(null);
    setSelectedEvaluationCaseId(null);
    setNotice("");
    setSidebarOpen(false);
    composerRef.current?.focus();
  }

  function applyTemplate(template: string) {
    setMessage(template);
    setSelectedEvaluationCaseId(null);
    setSidebarOpen(false);
    composerRef.current?.focus();
  }

  function applyEvaluationCase(evaluationCase: EvaluationCase) {
    changeLanguage(evaluationCase.language);
    setMessage(evaluationCase.prompt);
    setSelectedEvaluationCaseId(evaluationCase.id);
    setSidebarOpen(false);
    composerRef.current?.focus();
  }

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
    retryMessage?: ChatMessage,
  ) {
    event?.preventDefault();
    const content = retryMessage?.content ?? message.trim();
    if (!content || isTyping) return;

    setMessage("");
    setNotice("");
    if (!retryMessage) setRetryMessageId(null);
    setIsTyping(true);
    const activeEvaluationCase = evaluationCases.find(
      (evaluationCase) => evaluationCase.id === selectedEvaluationCaseId,
    );
    let activeConversationId = conversationId;
    let submittedUserMessage = retryMessage;
    let pendingAssistantMessageId: string | null = null;
    let responseCanBeRetried = false;

    try {
      if (!retryMessage && isSupabaseConfigured() && !activeConversationId) {
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

      const userMessage: ChatMessage = retryMessage ?? {
        id: newId(),
        sender: "user",
        content,
        timestamp: new Date().toISOString(),
        storageStatus: isSupabaseConfigured() ? "saving" : "not-saved",
      };
      submittedUserMessage = userMessage;

      if (!retryMessage) setMessages((current) => [...current, userMessage]);
      if (!retryMessage && isSupabaseConfigured() && activeConversationId) {
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
        setMessages((current) =>
          current.map((item) =>
            item.id === userMessage.id ? { ...item, storageStatus: "saved" } : item,
          ),
        );
      }
      responseCanBeRetried = true;

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
            responseLanguage: language,
          },
        ]);
        return;
      }

      const requestStartedAt = monotonicNow();
      setRetryMessageId(null);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...messages.filter((item) => item.id !== userMessage.id), userMessage]
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
            responseLanguage: language,
          },
        ]);
        return;
      }
      if (!response.ok) {
        throw new Error(result.error ?? `The model request failed (${response.status}).`);
      }
      if (!result.response?.trim()) throw new Error("The model returned an empty response.");
      responseCanBeRetried = false;

      const assistantMessage: ChatMessage = {
        id: newId(),
        sender: "assistant",
        content: result.response.trim(),
        timestamp: new Date().toISOString(),
        storageStatus: isSupabaseConfigured() ? "saving" : "not-saved",
        responseLanguage: language,
        durationMs: Math.round(monotonicNow() - requestStartedAt),
        ...(activeEvaluationCase ? { evaluationCaseId: activeEvaluationCase.id } : {}),
      };
      pendingAssistantMessageId = assistantMessage.id;

      if (activeEvaluationCase && assistantMessage.durationMs !== undefined) {
        persistEvaluationMetadata(assistantMessage.id, {
          caseId: activeEvaluationCase.id,
          language,
          durationMs: assistantMessage.durationMs,
        });
        setSelectedEvaluationCaseId(null);
      }
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
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessage.id ? { ...item, storageStatus: "saved" } : item,
          ),
        );
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
      if (submittedUserMessage) {
        setMessages((current) =>
          current.map((item) =>
            item.id === submittedUserMessage?.id && item.storageStatus === "saving"
              ? { ...item, storageStatus: "not-saved" }
              : item,
          ),
        );
      }
      if (pendingAssistantMessageId) {
        setMessages((current) =>
          current.map((item) =>
            item.id === pendingAssistantMessageId && item.storageStatus === "saving"
              ? { ...item, storageStatus: "not-saved" }
              : item,
          ),
        );
      }
      if (responseCanBeRetried && submittedUserMessage) {
        setRetryMessageId(submittedUserMessage.id);
      }
    } finally {
      setIsTyping(false);
    }
  }

  function clearLocalEvaluationData() {
    const confirmed = window.confirm(
      "Clear all feedback and judging metadata stored in this browser? This does not delete saved conversations or workspace feedback.",
    );
    if (!confirmed) return;

    try {
      localStorage.removeItem(feedbackStorageKey);
      localStorage.removeItem(evaluationStorageKey);
      setFeedback({});
      setMessages((current) =>
        current.map((item) => ({
          ...item,
          evaluationCaseId: undefined,
          durationMs: undefined,
        })),
      );
      setNotice("Browser-local feedback and judge metadata cleared.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Local evaluation data could not be cleared.");
    }
  }

  function changeLanguage(nextLanguage: Language) {
    setSelectedEvaluationCaseId(null);
    try {
      localStorage.setItem(languageStorageKey, nextLanguage);
      window.dispatchEvent(new Event(languagePreferenceEvent));
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `The language preference could not be changed or saved: ${error.message}`
          : "The language preference could not be changed or saved.",
      );
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
      helpful: false,
      helpfulRated: false,
      accuracy: 3,
      relevance: 3,
      accuracyRated: false,
      relevanceRated: false,
      saved: false,
    };
    const next = {
      ...current,
      helpful,
      helpfulRated: true,
      saved: false,
      workspaceSaved: false,
    };
    const locallySaved = persistFeedbackLocally(messageId, { ...next, saved: true });
    setFeedback((items) => ({
      ...items,
      [messageId]: { ...next, saved: locallySaved, workspaceSaved: false },
    }));

    if (!isSupabaseConfigured()) {
      if (locallySaved) setNotice("Thanks — your feedback was saved on this device.");
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
      setFeedback((items) => ({
        ...items,
        [messageId]: { ...next, saved: true, workspaceSaved: true },
      }));
      setNotice("Thanks — your feedback was saved.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Feedback could not be synced.";
      setNotice(
        locallySaved
          ? `Feedback is saved on this device. Workspace sync failed: ${detail}`
          : detail,
      );
    }
  }

  async function updateRating(
    messageId: string,
    field: "accuracy" | "relevance",
    value: number,
  ) {
    const current = feedback[messageId] ?? {
      helpful: false,
      helpfulRated: false,
      accuracy: 3,
      relevance: 3,
      accuracyRated: false,
      relevanceRated: false,
      saved: false,
    };
    const next: MessageFeedback =
      field === "accuracy"
        ? { ...current, accuracy: value, accuracyRated: true, saved: false, workspaceSaved: false }
        : { ...current, relevance: value, relevanceRated: true, saved: false, workspaceSaved: false };
    const locallySaved = persistFeedbackLocally(messageId, { ...next, saved: true });
    setFeedback((items) => ({
      ...items,
      [messageId]: { ...next, saved: locallySaved, workspaceSaved: false },
    }));

    if (!isSupabaseConfigured()) {
      if (locallySaved) setNotice("Your rating was saved on this device.");
      return;
    }
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
      setFeedback((items) => ({
        ...items,
        [messageId]: { ...next, saved: true, workspaceSaved: true },
      }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Feedback could not be synced.";
      setNotice(
        locallySaved
          ? `Your rating is saved on this device. Workspace sync failed: ${detail}`
          : detail,
      );
    }
  }

  const evaluationResponses = messages.flatMap((item, index) => {
    if (item.sender !== "assistant" || item.isDemo || !item.evaluationCaseId) return [];
    const evaluationCase = evaluationCases.find(
      (candidate) => candidate.id === item.evaluationCaseId,
    );
    if (!evaluationCase) return [];

    const promptMessage = messages
      .slice(0, index)
      .reverse()
      .find((candidate) => candidate.sender === "user");
    return [{ item, evaluationCase, prompt: promptMessage?.content ?? "", feedback: feedback[item.id] }];
  });
  const reviewedEvaluationResponses = evaluationResponses.filter(
    (result) =>
      result.feedback?.saved &&
      result.feedback.helpfulRated &&
      result.feedback.accuracyRated &&
      result.feedback.relevanceRated,
  );
  const reviewedEvaluationCaseCount = new Set(
    reviewedEvaluationResponses.map((result) => result.evaluationCase.id),
  ).size;
  const averageAccuracy = reviewedEvaluationResponses.length
    ? reviewedEvaluationResponses.reduce((sum, result) => sum + (result.feedback?.accuracy ?? 0), 0) /
      reviewedEvaluationResponses.length
    : null;
  const averageRelevance = reviewedEvaluationResponses.length
    ? reviewedEvaluationResponses.reduce((sum, result) => sum + (result.feedback?.relevance ?? 0), 0) /
      reviewedEvaluationResponses.length
    : null;

  function downloadEvaluationReport() {
    if (!evaluationResponses.length) {
      setNotice("Run at least one judge test against a live model response before exporting a report.");
      return;
    }

    const report = {
      product: "N-ATLAS Playground",
      generatedAt: new Date().toISOString(),
      scope: "Responses from the currently open conversation",
      methodology:
        "Qualitative evaluation. Ratings are supplied by the evaluator and are not an automated benchmark or independently verified ground truth.",
      coverage: {
        reviewedCases: reviewedEvaluationCaseCount,
        totalCases: evaluationCases.length,
      },
      results: evaluationResponses.map(({ item, evaluationCase, prompt, feedback: rating }) => ({
        caseId: evaluationCase.id,
        test: evaluationCase.title,
        responseLanguage: item.responseLanguage ?? evaluationCase.language,
        reviewFocus: evaluationCase.reviewFocus,
        prompt,
        response: item.content,
        clientObservedResponseTimeMs: item.durationMs ?? null,
        responseTimestamp: item.timestamp,
        review:
          rating?.saved &&
          rating.helpfulRated &&
          rating.accuracyRated &&
          rating.relevanceRated
          ? {
              status: "reviewed",
              helpful: rating.helpful,
              accuracy: rating.accuracy,
              relevance: rating.relevance,
            }
          : { status: "awaiting helpfulness, accuracy, and relevance ratings" },
      })),
    };
    const file = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const download = document.createElement("a");
    download.href = url;
    download.download = `natlas-judge-report-${new Date().toISOString().slice(0, 10)}.json`;
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const sidebar = (
    <aside className="flex h-full w-[min(19rem,88vw)] shrink-0 flex-col border-r border-white/[0.07] bg-[#09130e]">
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008751] text-sm font-black text-white">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#008751]/30 bg-[#008751]/[0.12] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-[#008751]/60 hover:bg-[#008751]/[0.2]"
        >
          <span className="text-lg leading-none text-emerald-300">+</span> New chat
        </button>
      </div>

      <nav className="mt-5 space-y-1 px-3" aria-label="Workspace">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-emerald-100 transition hover:bg-white/[0.05]"
        >
          <span aria-hidden="true">💬</span> Chat
        </button>
        <Link
          href="/prompts"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <span aria-hidden="true">📚</span> Prompt Library
        </Link>
        <button
          onClick={() => document.getElementById("recent-chats")?.scrollIntoView({ behavior: "smooth" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <span aria-hidden="true">🕘</span> History
        </button>
        <button
          ref={settingsButtonRef}
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <span aria-hidden="true">⚙️</span> Settings
        </button>
        <Link
          href="/signup"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          <span aria-hidden="true">🔐</span> Create account
        </Link>
      </nav>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto border-t border-white/[0.06] px-4 pb-5 pt-5">
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
              className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] leading-5 text-slate-400 transition hover:bg-[#008751]/[0.1] hover:text-slate-100"
            >
              {template}
            </button>
          ))}
        </div>

        <section className="mt-7 border-t border-white/[0.06] pt-5" aria-labelledby="judge-suite-title">
          <div className="flex items-center justify-between px-1">
            <h2
              id="judge-suite-title"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d6b45b]"
            >
              Judge evaluation suite
            </h2>
            <span className="text-[10px] text-slate-500">
              {reviewedEvaluationCaseCount}/{evaluationCases.length}
            </span>
          </div>
          <p className="px-1 pt-2 text-[10px] leading-4 text-slate-500">
            Repeatable tests across four languages and practical use cases.
          </p>
          <div className="mt-2 space-y-1">
            {evaluationCases.map((evaluationCase) => (
              <button
                key={evaluationCase.id}
                onClick={() => applyEvaluationCase(evaluationCase)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-400 transition hover:bg-[#008751]/[0.1] hover:text-slate-100"
              >
                <span className="truncate">{evaluationCase.title}</span>
                <span className="shrink-0 text-[9px] text-slate-600">{evaluationCase.language}</span>
              </button>
            ))}
          </div>
          <p className="px-1 pt-2 text-[10px] leading-4 text-slate-600">
            Human ratings are qualitative feedback, not an automated benchmark.
          </p>
          {reviewedEvaluationResponses.length > 0 && (
            <p className="px-1 pt-2 text-[10px] leading-4 text-slate-400">
              Average evaluator ratings · accuracy {averageAccuracy?.toFixed(1)}/5 · relevance{" "}
              {averageRelevance?.toFixed(1)}/5
            </p>
          )}
          <button
            type="button"
            onClick={downloadEvaluationReport}
            disabled={!evaluationResponses.length}
            className="mt-3 w-full rounded-lg border border-[#d6b45b]/20 px-3 py-2 text-left text-[11px] font-medium text-[#e3c879] transition hover:bg-[#d6b45b]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download judge report
          </button>
        </section>

        <div id="recent-chats" className="mb-3 mt-8 flex scroll-mt-4 items-center justify-between px-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Recent chats
          </h2>
          <span className="text-[10px] text-slate-600">{conversations.length}</span>
        </div>
        {conversations.length ? (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
              >
                <div
                  className={`flex items-center gap-1 rounded-lg transition ${
                    conversation.id === conversationId
                      ? "bg-[#008751]/15 text-emerald-100"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                  }`}
                >
                  <button
                    onClick={() => void openConversation(conversation)}
                    disabled={isTyping}
                    className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-xs"
                    aria-current={conversation.id === conversationId ? "page" : undefined}
                  >
                    {conversation.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteConversation(conversation)}
                    disabled={isTyping}
                    className="mr-1 rounded-md px-2 py-1 text-slate-500 transition hover:bg-red-400/10 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-300 disabled:opacity-40"
                    aria-label={`Delete conversation: ${conversation.title}`}
                    title="Delete conversation"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
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
        <Link
          href="/privacy"
          onClick={() => setSidebarOpen(false)}
          className="mt-3 inline-flex rounded text-[11px] text-slate-500 underline decoration-white/20 underline-offset-4 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b]"
        >
          Privacy & data controls
        </Link>
      </div>
    </aside>
  );

  return (
    <main className="flex h-dvh overflow-hidden bg-[#07110d] text-slate-100">
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
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-settings-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") setSettingsOpen(false);
            }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1710] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6b45b]">
                  Workspace preferences
                </p>
                <h2 id="workspace-settings-title" className="mt-2 text-xl font-semibold text-white">
                  Settings
                </h2>
              </div>
              <button
                ref={settingsCloseRef}
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  settingsButtonRef.current?.focus();
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b45b]"
                aria-label="Close settings"
              >
                Close
              </button>
            </div>

            <label className="mt-6 block text-xs font-medium text-slate-300" htmlFor="settings-language">
              Default response language
            </label>
            <select
              id="settings-language"
              value={language}
              onChange={(event) => {
                if (isLanguage(event.target.value)) changeLanguage(event.target.value);
              }}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#101a14] px-3 py-2.5 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b45b]"
            >
              {languages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              This preference is stored in this browser and applied to new chats.
            </p>

            <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <h3 className="text-xs font-semibold text-slate-200">Workspace data retention</h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Saved conversations remain in Supabase until you delete them. There is no automatic
                expiry. Deleting a conversation removes its messages and workspace feedback.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={clearLocalEvaluationData}
                className="rounded-lg border border-amber-200/20 px-3 py-2.5 text-left text-xs font-medium text-amber-100 transition hover:bg-amber-100/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b45b]"
              >
                Clear browser-local ratings &amp; judge data
              </button>
              <Link
                href="/privacy"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-white/10 px-3 py-2.5 text-left text-xs font-medium text-slate-300 transition hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b45b]"
              >
                Privacy &amp; data controls
              </Link>
            </div>
          </section>
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#08130e]/90 px-3 sm:px-7">
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
              <p className="mt-0.5 text-[11px] text-slate-500">
                {reviewedEvaluationCaseCount > 0
                  ? `${reviewedEvaluationCaseCount} of ${evaluationCases.length} judge cases reviewed`
                  : "Experiment with N-ATLAS"}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Response language</span>
            <select
              value={language}
              onChange={(event) => {
                if (isLanguage(event.target.value)) {
                  changeLanguage(event.target.value);
                }
              }}
              ref={languageSelectRef}
              className="rounded-lg border border-white/[0.09] bg-[#111a14] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#008751]/70"
              aria-label="Response language"
            >
              {languages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col">
            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-1 items-center justify-center text-sm text-slate-500"
              >
                Loading your workspace…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center py-8 sm:py-10">
                <div className="mb-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#008751]/35 bg-[#008751]/[0.14] text-lg font-bold text-emerald-200">
                    N
                  </div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.19em] text-[#d6b45b]">
                    Multilingual AI, made to build
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    What are you working on?
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
                    Choose a language or select a prompt template to begin.
                  </p>
                  <p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">
                    Run the same practical test prompts across English, Yoruba, Hausa, and Igbo.
                    Review real responses and rate accuracy and relevance.
                  </p>
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-px w-5 bg-[#d6b45b]/60" />
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Try the judge test suite
                    </h3>
                    <span className="text-[10px] text-slate-600">
                      {evaluationCases.length} repeatable tests
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {evaluationCases.map((evaluationCase) => (
                      <button
                        key={evaluationCase.id}
                        onClick={() => applyEvaluationCase(evaluationCase)}
                        className="group rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left text-xs leading-5 text-slate-300 transition hover:border-[#008751]/50 hover:bg-[#008751]/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b]"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-white">{evaluationCase.title}</span>
                          <span className="shrink-0 text-[9px] text-[#d6b45b]">
                            {evaluationCase.language}
                          </span>
                        </span>
                        <span className="mt-2 block text-slate-400">{evaluationCase.prompt}</span>
                        <span className="mt-2 block text-[10px] text-slate-600">
                          Review: {evaluationCase.reviewFocus}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-slate-600">
                    Demo previews are labeled and excluded from judge coverage. Translation prompts
                    use reviewer ratings; no single reference translation is treated as ground truth.
                  </p>
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
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
                        item.sender === "user"
                          ? "bg-[#d6b45b]/15 text-[#e8cf83]"
                          : "border border-[#008751]/30 bg-[#008751]/[0.14] text-emerald-100"
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
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-left text-sm leading-7 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:px-5 ${
                          item.sender === "user"
                            ? "rounded-tr-md border border-[#d6b45b]/15 bg-[#173024] text-slate-100"
                            : "rounded-tl-md border border-[#008751]/20 bg-[#0c1711] text-slate-200"
                        }`}
                      >
                        {item.content}
                      </div>
                      {item.storageStatus && (
                        <p
                          className={`mt-1 text-[10px] ${
                            item.storageStatus === "saved" ? "text-emerald-400/80" : "text-slate-600"
                          }`}
                        >
                          {item.storageStatus === "saved"
                            ? "Saved to your workspace"
                            : item.storageStatus === "saving"
                              ? "Saving to your workspace…"
                              : "Not saved to a workspace"}
                        </p>
                      )}
                      {item.sender === "user" && retryMessageId === item.id && (
                        <button
                          type="button"
                          onClick={() => void sendMessage(undefined, item)}
                          disabled={isTyping}
                          className="mt-2 rounded-lg border border-[#d6b45b]/25 px-3 py-1.5 text-[11px] font-medium text-[#e3c879] transition hover:bg-[#d6b45b]/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b] disabled:opacity-50"
                        >
                          Retry response
                        </button>
                      )}
                      {item.sender === "assistant" && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                          {item.responseLanguage && <span>Response language: {item.responseLanguage}</span>}
                          <span>{item.isDemo ? "Preview only · not model-generated" : "Live model endpoint"}</span>
                          {item.durationMs !== undefined && (
                            <span>
                              Endpoint round trip: {(item.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                          {item.evaluationCaseId && (
                            <span className="text-[#d6b45b]">
                              Judge test:{" "}
                              {evaluationCases.find(
                                (evaluationCase) => evaluationCase.id === item.evaluationCaseId,
                              )?.title ?? "Evaluation case"}
                            </span>
                          )}
                        </div>
                      )}
                      {item.sender === "assistant" && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="mr-1 text-slate-500">Was this useful?</span>
                          <button
                            onClick={() => void saveFeedback(item.id, true)}
                            aria-label="Helpful"
                            className={`rounded-lg border px-2.5 py-1.5 transition ${
                              feedback[item.id]?.helpfulRated && feedback[item.id].helpful
                                ? "border-[#008751]/50 bg-[#008751]/[0.15] text-emerald-100"
                                : "border-white/[0.08] text-slate-400 hover:border-[#008751]/35 hover:text-white"
                            }`}
                          >
                            👍 Helpful
                          </button>
                          <button
                            onClick={() => void saveFeedback(item.id, false)}
                            aria-label="Not Helpful"
                            className={`rounded-lg border px-2.5 py-1.5 transition ${
                              feedback[item.id]?.helpfulRated &&
                              feedback[item.id].helpful === false
                                ? "border-[#d6b45b]/40 bg-[#d6b45b]/[0.1] text-[#e8cf83]"
                                : "border-white/[0.08] text-slate-400 hover:border-[#d6b45b]/30 hover:text-white"
                            }`}
                          >
                            👎 Not Helpful
                          </button>
                          <label className="ml-2 flex items-center gap-1.5 text-slate-500">
                            Accuracy
                            <select
                              value={
                                feedback[item.id]?.accuracyRated
                                  ? feedback[item.id].accuracy
                                  : 0
                              }
                              onChange={(event) =>
                                void updateRating(item.id, "accuracy", Number(event.target.value))
                              }
                              className="rounded border border-white/[0.08] bg-[#101a14] px-1.5 py-1 text-slate-300"
                              aria-label="Rate accuracy from 1 to 5"
                            >
                              <option value={0} disabled>Rate</option>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <option key={rating} value={rating}>{rating}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex items-center gap-1.5 text-slate-500">
                            Relevance
                            <select
                              value={
                                feedback[item.id]?.relevanceRated
                                  ? feedback[item.id].relevance
                                  : 0
                              }
                              onChange={(event) =>
                                void updateRating(item.id, "relevance", Number(event.target.value))
                              }
                              className="rounded border border-white/[0.08] bg-[#101a14] px-1.5 py-1 text-slate-300"
                              aria-label="Rate relevance from 1 to 5"
                            >
                              <option value={0} disabled>Rate</option>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <option key={rating} value={rating}>{rating}</option>
                              ))}
                            </select>
                          </label>
                          {feedback[item.id]?.saved && (
                            <span className="text-emerald-300">
                              {feedback[item.id]?.workspaceSaved
                                ? "Synced to your workspace"
                                : "Saved on this device"}
                            </span>
                          )}
                          {feedback[item.id]?.saved &&
                            (!feedback[item.id].helpfulRated ||
                              !feedback[item.id].accuracyRated ||
                              !feedback[item.id].relevanceRated) && (
                              <span className="basis-full text-slate-500">
                                Rate helpfulness, accuracy, and relevance to count this test as reviewed.
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {isTyping && (
                  <div className="flex gap-3" role="status" aria-live="polite">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#008751]/30 bg-[#008751]/[0.14] text-[11px] font-bold text-emerald-100">
                      N
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-[#008751]/20 bg-[#0c1711] px-4 py-3.5">
                      <span className="flex items-center gap-2.5">
                        <span className="flex gap-1.5">
                          {[0, 1, 2].map((dot) => (
                            <span
                              key={dot}
                              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#32c786]"
                              style={{ animationDelay: `${dot * 180}ms` }}
                            />
                          ))}
                        </span>
                        <span className="text-[11px] text-slate-400">N-ATLAS is thinking</span>
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

        <footer className="shrink-0 border-t border-white/[0.07] bg-[#08130e]/90 px-3 pb-3 pt-3 sm:px-8 sm:pb-6">
          <div className="mx-auto max-w-4xl">
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
              className="rounded-2xl border border-white/[0.1] bg-[#101a14] p-2 shadow-[0_12px_50px_rgba(0,0,0,0.25)] focus-within:border-[#008751]/50"
            >
              <textarea
                ref={composerRef}
                value={message}
                onChange={(event) => {
                  const nextMessage = event.target.value;
                  setMessage(nextMessage);
                  const selectedCase = evaluationCases.find(
                    (evaluationCase) => evaluationCase.id === selectedEvaluationCaseId,
                  );
                  if (selectedCase && nextMessage !== selectedCase.prompt) {
                    setSelectedEvaluationCaseId(null);
                  }
                }}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message N-ATLAS…"
                rows={2}
                maxLength={8000}
                aria-describedby="message-composer-hint"
                disabled={isTyping || isLoading}
                className="max-h-40 min-h-12 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:opacity-60"
                aria-label="Message N-ATLAS"
              />
              {selectedEvaluationCaseId && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2 text-[10px] text-[#e3c879]">
                  <span>
                    Judge test:{" "}
                    {evaluationCases.find(
                      (evaluationCase) => evaluationCase.id === selectedEvaluationCaseId,
                    )?.title ?? "Evaluation case"}
                  </span>
                  <span>Response language · {language}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-1 pb-0.5">
                <span id="message-composer-hint" className="px-2 text-[10px] text-slate-600">
                  Up to 8,000 characters · Enter to send · Shift + Enter for a new line
                </span>
                <span aria-hidden="true" className="mr-auto text-[10px] text-slate-600">
                  {message.length}/8000
                </span>
                <button
                  type="submit"
                  disabled={!message.trim() || isTyping || isLoading}
                  className="flex h-9 items-center gap-2 rounded-xl bg-[#008751] px-4 text-xs font-semibold text-white transition hover:bg-[#07975f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isTyping ? "Sending…" : "Send"} <span aria-hidden="true">↑</span>
                </button>
              </div>
            </form>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] text-slate-600">
              <span>N-ATLAS can make mistakes. Review important information.</span>
              <span aria-hidden="true">·</span>
              <Link
                href="/privacy"
                className="rounded underline decoration-white/20 underline-offset-2 transition hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b45b]"
              >
                Privacy &amp; data controls
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
