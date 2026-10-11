const supportedLanguages = new Set(["English", "Yoruba", "Hausa", "Igbo"]);

type ChatRequest = {
  messages?: unknown;
  language?: unknown;
};

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const modelUrl = process.env.NATLAS_CHAT_API_URL;
  const modelKey = process.env.NATLAS_CHAT_API_KEY;

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

  let modelResponse: Response;
  try {
    modelResponse = await fetch(modelUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: body.messages, language: body.language }),
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

  let modelBody: { response?: unknown };
  try {
    modelBody = (await modelResponse.json()) as { response?: unknown };
  } catch {
    return Response.json({ error: "The N-ATLAS endpoint returned an invalid response." }, { status: 502 });
  }
  if (typeof modelBody.response !== "string" || !modelBody.response.trim()) {
    return Response.json(
      { error: 'The N-ATLAS endpoint response must contain a non-empty "response" string.' },
      { status: 502 },
    );
  }

  return Response.json({ response: modelBody.response });
}
