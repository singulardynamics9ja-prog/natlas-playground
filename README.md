# N-ATLAS Playground

A responsive developer workspace for experimenting with N-ATLAS across English, Yoruba, Hausa, and Igbo.

## Run locally

1. Install dependencies with `npm install`.
2. Run `npm run dev` and open <http://localhost:3000> to use the playground in local demo mode.
3. To enable conversation storage and response generation, copy `.env.example` to `.env.local` and configure the optional integrations below.

Local demo mode works without additional infrastructure. It does not save conversations remotely; feedback and judging metadata are stored in the current browser. Preview responses are clearly labeled and are not presented as N-ATLAS output.

### Optional Supabase storage

Apply `supabase/migrations/20261010000000_initial_schema.sql` to your Supabase project. In Supabase Auth, enable anonymous sign-ins; the app uses anonymous accounts for private, per-user conversations and does not require email addresses. Then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

The anonymous session is kept in the current browser tab. Refreshing that tab preserves access, but closing the tab or clearing site data can make an anonymous account unrecoverable. Conversations saved to Supabase remain there until deleted. Use the delete control beside a conversation in the chat history to delete that conversation and its messages and workspace feedback. This also clears browser-local feedback and judge metadata; clearing browser site data alone does not remove Supabase records.

See the in-app [Privacy & data controls](/privacy) page for details about what is stored locally, what is sent to a configured model endpoint, and how to remove data.

### Optional model gateway

Configure `NATLAS_CHAT_API_URL` and, if required, `NATLAS_CHAT_API_KEY` for your model gateway.

## Model gateway contract

The configured server-side `NATLAS_CHAT_API_URL` receives a `POST` request with JSON:

```json
{
  "messages": [
    { "role": "user", "content": "Explain AI in simple terms" }
  ],
  "language": "English"
}
```

The `messages` array contains up to 30 recent turns with `user` or `assistant` roles. The gateway must return JSON containing a non-empty `response` string. If the gateway requires a bearer token, set `NATLAS_CHAT_API_KEY`; this secret is only used by the server route and is never sent to the browser. The Supabase access token is validated before forwarding a request.

## Judge evaluation suite

The chat includes six repeatable evaluation prompts: a Yoruba, Hausa, and Igbo translation; an English explanation for a secondary school student; a Nigerian fintech business plan; and a grant proposal outline. Selecting a case sets its response language and marks the resulting live endpoint response for the suite. Reviewers can rate helpfulness, accuracy, and relevance using the existing feedback controls; all three ratings must be explicitly submitted for a case to count as reviewed.

The coverage count and average ratings describe evaluator-submitted feedback in the current conversation; they are qualitative, not automated model scores. Demo previews are excluded. Translation review guidance focuses on meaning and natural language, not exact string matching to a single reference translation. Judge reports download as JSON and include the current conversation's prompts, live responses, client-observed endpoint round-trip times, and any submitted ratings. Reports may contain conversation content; review them before sharing.

Feedback ratings are saved in the current browser and synced to the signed-in workspace when Supabase is configured. Saved workspace ratings are restored when a conversation is reopened. Judge labels, response language, and round-trip timings remain local to that browser.

## Database and access control

The SQL migration creates `profiles`, `conversations`, `messages`, and `feedback`, with row-level security enabled. Conversation and message access is scoped to the signed-in Supabase user. Feedback can only be submitted for assistant messages in that user's conversations.

## Production deployment

The application deploys through the repository's existing GitHub-to-Vercel integration as a standard Next.js App Router application. The deployed environment needs the Supabase URL and anon key, plus the server-side model gateway URL and (if required) API key. Keep `NATLAS_CHAT_API_KEY` server-only; only the Supabase project URL and anon key use the `NEXT_PUBLIC_` prefix.
