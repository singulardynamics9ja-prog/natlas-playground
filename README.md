# N-ATLAS Playground

A responsive developer workspace for experimenting with N-ATLAS across English, Yoruba, Hausa, and Igbo.

## Run locally

1. Install dependencies with `npm install`.
2. Run `npm run dev` and open <http://localhost:3000> to use the playground in local demo mode.
3. To enable conversation storage and response generation, copy `.env.example` to `.env.local` and configure the optional integrations below.

Local demo mode works without additional infrastructure. It does not save conversations or feedback, and clearly labels its preview instead of presenting it as an N-ATLAS response.

### Optional Supabase storage

Apply `supabase/migrations/20261010000000_initial_schema.sql` to your Supabase project. In Supabase Auth, enable anonymous sign-ins; the app uses anonymous accounts for private, per-user conversations and does not require email addresses. Then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

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

## Database and access control

The SQL migration creates `profiles`, `conversations`, `messages`, and `feedback`, with row-level security enabled. Conversation and message access is scoped to the signed-in Supabase user. Feedback can only be submitted for assistant messages in that user's conversations.

## Production deployment

Deploy as a standard Next.js App Router application on Vercel. Configure the four environment variables in the Vercel project settings and apply the migration to the production Supabase project. Keep `NATLAS_CHAT_API_KEY` server-only; only the Supabase project URL and anon key use the `NEXT_PUBLIC_` prefix.
