# Blueprint Chat

Blueprint Chat is a React + Vite front-end that provides a streaming chat experience on top of an authenticated Blueprint environment. It relies on AWS Cognito for sign-in and consumes streaming responses from a backend that proxies the AWS Bedrock Converse API.

## Features
- React 19 + Vite + TypeScript application scaffolded for client-side routing with React Router
- OAuth 2.0 / OIDC sign-in flow powered by Amazon Cognito via `react-oidc-context`
- Streaming assistant responses rendered incrementally, including “thinking” traces when supplied by the model
- Tailwind CSS based component system with Radix UI primitives and utility helpers

## Prerequisites
- Node.js 20.x (recommended) and npm 10+
- Access to an API endpoint that implements the Bedrock Converse streaming contract
- Cognito user pool + app client configured for the chat experience

## Quick Start
1. Install dependencies: `npm install`
2. Create an `.env.local` file with the backend endpoint, for example:
   ```bash
   VITE_API_BASE_URL="https://your-backend.example.com/chat"
   ```
3. Update the Cognito settings in `src/main.tsx` if you are running locally. At a minimum set `redirect_uri` to your dev URL (e.g. `http://localhost:5173/`).
4. Start the dev server: `npm run dev`
5. Visit the printed URL, sign in with an authorized Cognito user, and start chatting.

## Available Scripts
- `npm run dev`: Start the Vite development server with hot module reload
- `npm run build`: Type-check and produce an optimized production build in `dist/`
- `npm run preview`: Serve the production build locally for QA
- `npm run lint`: Run ESLint across the project

## Project Structure
```text
src/
├─ api/               # API helpers for streaming chat responses
├─ components/        # Presentational and reusable UI building blocks
├─ pages/             # Route-level views (Chat)
├─ hooks/             # Custom React hooks
├─ interface/         # Shared TypeScript interfaces and types
└─ lib/               # Utility modules and configuration helpers
```

## Environment & Auth Configuration
- `VITE_API_BASE_URL` must point at a service that returns newline-delimited JSON chunks compatible with Bedrock Converse.
- Cognito configuration (authority, client ID, redirect URI, scopes) lives in `src/main.tsx`. Mirror the settings from your Cognito app client and ensure redirect URIs are whitelisted for both local and production domains.

## Troubleshooting
- If no messages appear, confirm the access token is being forwarded and that the backend supports streaming chunked responses.
- Authentication loops usually mean the Cognito callback URL does not match the one configured in `src/main.tsx`.
- For CORS issues, verify that the backend allows the origin of your dev server (`http://localhost:5173`).
