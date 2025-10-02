# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 AI chatbot template built with the AI SDK. It provides a full-featured chat interface with support for artifacts (interactive documents), real-time streaming, and multi-model AI capabilities. The application uses xAI models (Grok) via Vercel's AI Gateway, with support for both vision and reasoning models.

## Development Commands

### Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server with Turbopack at <http://localhost:3000>
- `pnpm build` - Run database migrations and build for production
- `pnpm start` - Start production server

### Code Quality

- `npx ultracite check` - Check code for linting/formatting issues
- `npx ultracite fix` - Automatically format and fix code issues

### Database

- `pnpm db:generate` - Generate Drizzle migration files
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio for database inspection
- `pnpm db:push` - Push schema changes directly to database
- `pnpm db:pull` - Pull schema from database
- `pnpm db:check` - Check for migration issues
- `pnpm db:up` - Upgrade Drizzle metadata

### Testing

- `pnpm test` - Run Playwright E2E tests
- Test files are in `tests/` directory with two categories:
  - `tests/e2e/` - End-to-end UI tests
  - `tests/routes/` - API route tests

## Architecture

### Application Structure

**Route Groups:**

- `app/(chat)/` - Main chat interface with artifacts support
- `app/(auth)/` - Authentication routes (login, register, guest access)

**Key Architectural Patterns:**

1. **Artifacts System**: Interactive documents that render alongside chat

   - Four artifact types: text, code (Python), image, spreadsheet (CSV)
   - Each artifact has client and server components in `artifacts/{type}/`
   - Real-time collaboration with version history and suggestions
   - Artifacts use the `useArtifact` hook for state management

2. **AI Provider Architecture**:

   - Uses Vercel AI Gateway to route requests to xAI models
   - Custom provider system in `lib/ai/providers.ts` that switches between real models and mocks for testing
   - Two chat models: `chat-model` (Grok Vision) and `chat-model-reasoning` (Grok with extracted reasoning)
   - Reasoning extraction uses `extractReasoningMiddleware` with `<think>` tags

3. **Authentication Flow**:

   - NextAuth.js v5 with custom Credentials provider
   - Supports both regular users and guest users
   - Guest users are auto-created via `/api/auth/guest` when no token exists
   - Middleware redirects unauthenticated users to guest flow
   - Session data includes user type (`guest` | `regular`)

4. **Database Layer**:

   - Drizzle ORM with PostgreSQL (Neon Serverless Postgres)
   - Schema in `lib/db/schema.ts` includes versioned tables (Message_v2, Vote_v2)
   - Deprecated tables maintained for migration compatibility
   - Complex multi-column foreign keys for document-suggestion relationships
   - Stores chat context as JSONB for session continuity

5. **Real-time Streaming**:
   - Uses AI SDK's streaming capabilities with React Server Components
   - Custom `data-stream-handler` component processes server events
   - Resumable streams for handling connection interruptions (see `resumable-stream` package)
   - Stream state stored in database for persistence

### Data Flow

**Chat Message Flow:**

1. User input → `MultimodalInput` component
2. Message sent via `sendMessage` from `useChat` hook
3. Server processes in `app/(chat)/api/chat/route.ts`
4. AI response streamed back with tool calls (createDocument, updateDocument)
5. Tools trigger artifact updates via `useArtifact` hook
6. Messages persisted to database with attachments and parts structure

**Artifact Lifecycle:**

1. AI calls `createDocument` tool with content and type
2. Client creates new artifact, sets status to "streaming"
3. Document saved to database, gets unique ID
4. Artifact rendered using type-specific component from `artifacts/{type}/client.tsx`
5. User can request updates via `updateDocument` tool
6. Version history tracked, suggestions stored separately

### Component Organization

- `components/` - Reusable React components (47+ components)
- `hooks/` - Custom React hooks:
  - `use-artifact.ts` - Artifact state management with localStorage persistence
  - `use-auto-resume.ts` - Auto-resume interrupted streams
  - `use-chat-visibility.ts` - Chat visibility state
  - `use-messages.tsx` - Message processing and rendering
  - `use-scroll-to-bottom.tsx` - Auto-scroll behavior
- `lib/ai/tools/` - AI SDK tool definitions
- `lib/db/` - Database schema, queries, and migrations
- `lib/editor/` - ProseMirror and CodeMirror configurations

### Environment Variables

Required in `.env.local`:

- `AUTH_SECRET` - NextAuth session secret (generate with `openssl rand -base64 32`)
- `DATABASE_URL` - Database connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `REDIS_URL` - Redis connection for caching (optional)
- `AI_GATEWAY_API_KEY` - Only required for non-Vercel deployments (Vercel uses OIDC)

### Testing Environment

- Playwright tests automatically set `PLAYWRIGHT=True` environment variable
- Mock AI models activated when `isTestEnvironment === true`
- Mock models in `lib/ai/models.mock.ts` provide deterministic responses
- Development server must respond to `/ping` endpoint for test startup

## Code Quality Standards

This project uses **Ultracite** (Biome-based formatter/linter) with strict rules defined in `.cursor/rules/ultracite.mdc`. Key principles:

- **TypeScript**: Strict type safety, no `any`, use `import type` for types, no enums
- **React**: No array index keys, hooks follow Rules of Hooks, use fragments (`<>`)
- **Accessibility**: Comprehensive a11y rules enforced (ARIA, semantic HTML)
- **Async**: No `await` in loops, promises must be handled
- **Style**: Use `const`, arrow functions, template literals, optional chaining

When writing code, always run `npx ultracite fix` before committing to ensure compliance.

## AI Integration Notes

### System Prompts

The application uses different prompts based on model selection:

- `regularPrompt` - Base conversational prompt
- `artifactsPrompt` - Enables artifact mode with document creation/updating
- `codePrompt` - Guidelines for Python code generation (no external deps, self-contained)
- `sheetPrompt` - CSV spreadsheet creation guidelines
- Prompts augmented with geolocation data from request headers

### Tool Calling Pattern

AI tools follow a specific pattern:

1. Tool defined in `lib/ai/tools/{tool-name}.ts` with Zod schema
2. Tool execution happens server-side during streaming
3. Client handles tool results via data stream events
4. State updates trigger UI re-renders automatically

### Model Selection

- `chat-model` (default): Grok Vision - multimodal with vision capabilities
- `chat-model-reasoning`: Grok Mini with reasoning extraction - for complex problems
- `title-model`: Grok 2 - for generating chat titles
- `artifact-model`: Grok 2 - for processing artifact content

Reasoning model uses special `<think>` tags that are stripped from user-visible output but available for debugging.

## Common Patterns

### Creating a New Artifact Type

1. Create directory: `artifacts/{type}/`
2. Add client component: `artifacts/{type}/client.tsx` with artifact definition
3. Add server actions: `artifacts/{type}/actions.ts`
4. Register in `components/artifact.tsx` artifactDefinitions array
5. Update `ArtifactKind` type
6. Add prompt in `lib/ai/prompts.ts` if needed

### Adding a New AI Tool

1. Create tool file: `lib/ai/tools/{tool-name}.ts`
2. Define with `tool()` helper, include Zod schema
3. Add to tools object in chat route handler
4. Handle tool results in `DataStreamHandler` component if needed
5. Update system prompt if tool should be contextually enabled

### Database Schema Changes

1. Modify `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Review generated migration in `lib/db/migrations/`
4. Test migration with `pnpm db:migrate`
5. Migrations run automatically during build (`pnpm build`)
