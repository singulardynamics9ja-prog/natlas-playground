# N-ATLAS Playground

A responsive developer workspace for experimenting with N-ATLAS across English, Yoruba, Hausa, and Igbo.

## Run locally

1. Install dependencies with `npm install`.
2. Run `npm run dev` and open <http://localhost:3000> to use the playground in local demo mode.
3. To enable conversation storage and response generation, copy `.env.example` to `.env.local` and configure the optional integrations below.

Local demo mode works without additional infrastructure. It does not save conversations remotely; feedback and judging metadata are stored in the current browser. Preview responses are clearly labeled and are not presented as N-ATLAS output.

### Optional Supabase storage

Apply `supabase/migrations/20261010000000_initial_schema.sql` to your Supabase project. In Supabase Auth, enable anonymous sign-ins and email/password authentication; the app starts with anonymous accounts for private, per-user conversations, and `/signup` can link an existing workspace to an email and password. `/login` signs into an existing account. Then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

The session is kept in the current browser tab. Refreshing that tab preserves access; linking an anonymous workspace to an email and password lets you sign into it from another browser. Conversations saved to Supabase remain there until deleted; the current retention policy is manual user deletion, with no automatic expiry. Use the delete control beside a conversation in the chat history to delete that conversation and its messages and workspace feedback. Browser-local feedback and judge metadata for those messages are removed while data for other conversations is preserved. Settings can clear all local ratings and judge metadata. Clearing browser site data alone does not remove Supabase records.

See the in-app [Privacy & data controls](/privacy) page for details about what is stored locally, what is sent to a configured model endpoint, and how to remove data.

### Supabase account setup and production checklist

1. In the Supabase SQL Editor for your project, run `supabase/migrations/20261010000000_initial_schema.sql`.
2. In **Authentication → Providers**, enable **Anonymous Sign-Ins** and **Email**. Keep email confirmations enabled for production.
3. In **Authentication → URL Configuration**, set **Site URL** to the production origin (for example, `https://your-app.example.com`). Add `http://localhost:3000/**` and `https://your-app.example.com/**` to **Redirect URLs**, replacing the production example with your actual domain. The app redirects email-confirmation and password-recovery links to `/login` and `/reset-password` on the current origin. Add any Vercel preview origins you intend to test explicitly; do not use an unrestricted wildcard in production.
4. In Vercel **Project Settings → Environment Variables**, set `NEXT_PUBLIC_SUPABASE_URL` and the project's public **publishable** key (or legacy anon key) for **Production**. Never use a `service_role` key in the browser or a `NEXT_PUBLIC_` variable. Redeploy the production branch after changing environment variables.
5. After the deployment is ready, test a new account from an anonymous workspace: save a conversation, create the account, confirm the email, then sign in again and verify the conversation is still present. Also test sign-in in a separate browser, password reset from `/forgot-password`, and that an expired or reused reset link is rejected.

Database changes and production secrets must be applied in the Supabase and Vercel dashboards; they cannot be applied by the client app. Do not consider production account storage ready until the migration, redirect URLs, environment variables, and end-to-end checks above are complete.

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

The coverage count and average ratings describe evaluator-submitted feedback in the current conversation; they are qualitative, not automated model scores. Demo previews are excluded. Translation review guidance focuses on meaning and natural language, not exact string matching to a single reference translation. Judge reports download as JSON and include the current conversation's prompts, live responses, client-observed endpoint round-trip times, and any submitted ratings. Reports may contain conversation content; review them before sharing. See the [response review guide](./docs/evaluation-guide.md) for rating anchors, multilingual reviewer guidance, and safe issue reporting.

Feedback ratings are saved in the current browser and synced to the signed-in workspace when Supabase is configured. Saved workspace ratings are restored when a conversation is reopened. Judge labels, response language, and round-trip timings remain local to that browser.

## Database and access control

The SQL migration creates `profiles`, `conversations`, `messages`, and `feedback`, with row-level security enabled. Conversation and message access is scoped to the signed-in Supabase user. Feedback can only be submitted for assistant messages in that user's conversations.

## Production deployment

The application deploys through the repository's existing GitHub-to-Vercel integration as a standard Next.js App Router application. The deployed environment needs the Supabase URL and anon key, plus the server-side model gateway URL and (if required) API key. Keep `NATLAS_CHAT_API_KEY` server-only; only the Supabase project URL and anon key use the `NEXT_PUBLIC_` prefix.

## Verification and model launch safeguards

Run `npm test`, `npm run lint`, and `npm run build` before deploying. The built-in Node test runner covers the browser-data cleanup behavior without an additional test dependency. Before a real endpoint is enabled:

- Verify anonymous sign-in, conversation creation, reload/reopen, feedback restore, conversation-specific deletion, and local-only data clearing in a staging workspace.
- Have fluent reviewers assess the Yoruba, Hausa, and Igbo cases using the [response review guide](./docs/evaluation-guide.md); keep demo previews out of model-quality reports.
- Set server-side per-user and per-IP request limits, concurrency limits, provider spend caps, and useful 429/timeout errors at the model gateway or another shared server-side limiter. The browser's 8,000-character and 30-message limits are usability/input bounds, not abuse protection; client-only throttling is not a security control.
- Review data retention with project stakeholders. Until a different policy is agreed and implemented, conversations remain until the user deletes them; anonymous accounts may become unrecoverable if their session is lost.
- Review the model provider's data handling and update the privacy page before sending user prompts to it.
