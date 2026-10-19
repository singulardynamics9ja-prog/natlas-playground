const supportedLanguages = new Set(["English", "Yoruba", "Hausa", "Igbo"]);

// Allow slow first responses on hosts that honor this (e.g. Vercel).
export const maxDuration = 60;

type ChatRequest = {
  messages?: unknown;
  language?: unknown;
};

type OpenAIChatResponse = {
  choices?: { message?: { content?: unknown } }[];
};

function buildSystemPrompt(language: string) {
  return [
    "You are a friendly, helpful assistant built on N-ATLaS, a model trained by Awarri AI technologies.",
    `Always reply in ${language}, unless the user clearly asks for a different language.`,
    "Keep answers clear and reasonably concise.",
  ].join(" ");
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const modelUrl = process.env.NATLAS_CHAT_API_URL; // full URL, ends with /v1/chat/completions
  const modelKey = process.env.NATLAS_CHAT_API_KEY;
  const modelName = process.env.NATLAS_MODEL || "NCAIR1/N-ATLaS";

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Supabase is not configured on this deployment." }, { status: 503 });
  }
  if (!modelUrl) {
    return Response.json(
      {
        code: "MODEL_NOT_CONFIGURED",
        error: "The N-ATLAS model endpoint is not configured on this deployment.",
      },
      { status: 503 },
    );
  }
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "A valid workspace session is required." }, { status: 401 });
  }

  const sessionResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: authorization },
    cache: "no-store",
  });
  if (!sessionResponse.ok) {
    return Response.json({ error: "Your workspace session has expired. Refresh and try again." }, { status: 401 });
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 30 ||
    body.messages.some(
      (message) =>
        typeof message !== "object" ||
        message === null ||
        !("role" in message) ||
        !("content" in message) ||
        !["user", "assistant"].includes(String(message.role)) ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length > 8000,
    )
  ) {
    return Response.json(
      { error: "Provide between 1 and 30 valid messages, each no longer than 8,000 characters." },
      { status: 400 },
    );
  }
  if (typeof body.language !== "string" || !supportedLanguages.has(body.language)) {
    return Response.json({ error: "Choose English, Yoruba, Hausa, or Igbo." }, { status: 400 });
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (modelKey) headers.Authorization = `Bearer ${modelKey}`;

  // Keep only role/content from the client, and add our own system prompt.
  const chatMessages = (body.messages as { role: string; content: string }[]).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let modelResponse: Response;
  try {
    modelResponse = await fetch(modelUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "system", content: buildSystemPrompt(body.language) }, ...chatMessages],
        max_tokens: 600,
        temperature: 0.1,
        repetition_penalty: 1.12,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    console.error("N-ATLAS model endpoint could not be reached", error);
    return Response.json({ error: "The N-ATLAS model endpoint could not be reached." }, { status: 502 });
  }
  if (!modelResponse.ok) {
    console.error("N-ATLAS model request failed", { status: modelResponse.status });
    return Response.json({ error: "The N-ATLAS model request failed. Please try again." }, { status: 502 });
  }

  let modelBody: OpenAIChatResponse;
  try {
    modelBody = (await modelResponse.json()) as OpenAIChatResponse;
  } catch {
    return Response.json({ error: "The N-ATLAS endpoint returned an invalid response." }, { status: 502 });
  }

  const content = modelBody.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return Response.json(
      { error: "The N-ATLAS endpoint returned an empty response." },
      { status: 502 },
    );
  }

  return Response.json({ response: content.trim() });
}