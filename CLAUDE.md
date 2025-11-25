# CLAUDE.md

This file provides guidance to Claude Code when working with this codebase.

## Project Overview

**Random speed dating application**: Users are randomly paired for 15-minute anonymous chats. After the timer, both decide if they want to continue. If both say yes → profiles revealed + extended chat. If either says no → chat ends.

**Tech Stack**:
- **Frontend**: TanStack Start (React 19), shadcn/ui, Tailwind CSS v4
- **Backend**: Convex (serverless real-time database)
- **Auth**: Clerk (managed auth with JWT integration)
- **Real-time**: Convex handles WebSockets automatically via `useQuery` hooks

## Status Snapshot (Nov 25, 2025)
- **MAJOR CHANGE**: Matches are now **persistent WhatsApp-style chats**. No more chat requests needed - matched users can message anytime.
- **E2EE IMPLEMENTED**: End-to-end encryption for matched chats using libsodium (X25519 + XSalsa20-Poly1305).
- **Cut Connection**: Either user can "cut" the connection, which removes the chat for both users and deletes all messages.
- **Profile reveal**: Profile cards now appear inline in the chat stream (not at the top) when users match.
- **New message indicator**: Uses `use-stick-to-bottom` library - no auto-scroll, shows "New messages" button when user has scrolled up.
- **Decision timeout**: 30 seconds to respond after the 15-minute timer. If one user says Yes and the other doesn't respond, chat times out.
- **Cancel decision**: Users can change their mind while waiting for the other person to decide.
- `src/hooks/useRequireAuth.ts` now owns all protected-route redirects. Always call this hook right after `useUser()` so navigation happens inside an effect instead of during render.
- `convex/queue.join` refuses to auto-create users; if a Clerk identity is missing in Convex, the frontend surfaces the `AccountNotFound` view and prompts the user to sign out.
- Boilerplate routes from TanStack Start template removed (posts, users, deferred, redirect, _pathlessLayout).

## End-to-End Encryption (E2EE)

### Architecture
**ALL messages** are end-to-end encrypted. The server cannot read message content.

```
Speed Dating Phase: E2EE encrypted (server stores ciphertext only)
Extended Phase:     E2EE encrypted (server stores ciphertext only)
```

### How It Works
1. **Key Generation**: Each user generates an X25519 keypair on first login
2. **Key Storage**: Private keys stored in IndexedDB (never sent to server), public keys stored in Convex
3. **Key Exchange**: When users match, they derive a shared secret using ECDH (Diffie-Hellman)
4. **Encryption**: Messages encrypted with XSalsa20-Poly1305 before sending
5. **Decryption**: Messages decrypted client-side using shared secret

### Key Files
- `src/lib/encryption.ts` - Encryption/decryption utilities using libsodium
- `src/lib/keyStorage.ts` - IndexedDB storage for private keys
- `src/hooks/useEncryption.ts` - React hook for managing E2EE state (includes key backup/restore detection)
- `src/components/encryption/KeyBackupRestore.tsx` - UI component for key backup/restore
- `convex/encryption.ts` - Convex mutations/queries for public key management

### Database Fields
- `users.publicKey` - Base64 encoded X25519 public key
- `messages.isEncrypted` - Boolean flag for encrypted messages
- `messages.encryptedContent` - Base64 encoded ciphertext
- `messages.nonce` - Base64 encoded nonce for decryption

### Moderation Support
E2EE includes a report system for admin moderation:
- When a user reports a message, their client includes the **decrypted content** in the report
- Reports are stored in `reports` table with plaintext for admin review
- This allows moderation without breaking E2EE for normal messages

### Cross-Device Key Sync
Since private keys are stored locally in IndexedDB, users need to backup/restore keys to access encrypted messages on other devices:

1. **Key Backup UI**: Available in Profile page → "Encryption Keys" section
2. **New Device Detection**: When logging in on a new device without local keys, a banner appears in chat
3. **Key Restore Options**:
   - Import backup JSON file (recommended)
   - Generate new keys (loses access to old messages)
4. **Component**: `src/components/encryption/KeyBackupRestore.tsx` (supports full, compact, banner variants)

### Backup Security (Signal-style)
Following industry best practices from Signal:

1. **Passphrase Protection**: Backup files are encrypted with user-provided passphrase
2. **Key Derivation**: PBKDF2 with 100,000 iterations + SHA-256
3. **Encryption**: AES-256-GCM for authenticated encryption
4. **Versioning**: v1 = legacy unencrypted (backward compatible), v2 = encrypted (recommended)
5. **Salt**: Random 16-byte salt per backup prevents rainbow table attacks

```typescript
// Backup file format (v2 - encrypted)
{
  "version": 2,
  "encrypted": true,
  "data": "<base64 ciphertext>",
  "salt": "<base64 salt>",
  "iv": "<base64 initialization vector>"
}
```

### Important Notes
- **ALL messages are encrypted** (both speed dating and extended phases)
- **Private keys are device-specific** - if user clears browser data, they can't decrypt old messages
- **Key backup** - users should backup keys from Profile page before switching devices
- E2EE indicator shows green lock icon in chat when enabled
- If encryption fails, message is NOT sent (prevents accidental plaintext leak)
- Missing keys show helpful "Import your key backup" message in chat

## Key Technical Concepts

### Convex Real-Time
- `useQuery` hooks auto-update when DB changes (no manual subscriptions)
- Types auto-generated in `convex/_generated/`
- See `src/routes/chat/$chatId.tsx` for real-time messaging example

### Matching Algorithm (`convex/queue.ts`)
- Uses atomic operations to prevent race conditions
- "Claim-first, verify-second" pattern prevents duplicate matches
- Random selection from queue with `isInQueue` index

### Authentication (Clerk + Convex)
- **Setup**: Create Clerk JWT template (select "Convex" preset) + `convex/auth.config.js`
- **Frontend**: `ClerkProvider` wraps `ConvexProviderWithClerk` with `useAuth` prop
- **Backend**: Access `ctx.auth.getUserIdentity()` in queries/mutations
- **User sync**: Rely on Clerk webhooks (`convex/users.upsertFromClerk`) to create/update users. Server mutations such as `queue.join` never auto-create; missing users should surface the `AccountNotFound` UI so deleted accounts stay deleted.

## Development Workflow

### MCP Servers - REQUIRED for Code Changes
Before implementing ANY code changes, ground your approach using MCP servers:
1. **Research first**: Use context7 for docs, exa for real-world examples
2. **Implement second**: Follow verified patterns from MCP research
3. Use MCP for: TanStack Start/Router, shadcn/ui, React 19 patterns, unfamiliar APIs

### Dev Commands
```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Vite dev server
npm run dev

# Production
npm run build && npm run start
npx convex deploy  # Deploy backend
```

## Architecture Quick Reference

### File-Based Routing (TanStack Start)
- Routes in `src/routes/` export `Route` objects via `createFileRoute()`
- `src/routeTree.gen.ts` is auto-generated (never edit)
- Use `head()` function in `__root.tsx` for meta tags (not `<head>` tags)
- Path aliases: `@/*` and `~/*` → `src/*`

### Tailwind CSS v4 (Breaking Changes from v3!)
- Must use `@theme inline` block in `src/styles/app.css`
- CSS variables: prefix with `--color-` (e.g., `--color-border`)
- **NEVER use `@apply` with shadcn tokens** - use CSS properties directly
- Import syntax: `@import 'tailwindcss' source('../');`

### React Best Practices (Critical!)
- **Avoid useEffect for**: data transformation, event handlers, computed values
- **Use useEffect only for**: external systems (browser APIs), post-render side effects
- **Rule**: "User clicked button" → event handler | "Component mounted" → useEffect
- Use refs to prevent infinite loops (see `dashboard.tsx` example)
- Auth redirects must use `useRequireAuth` (see `src/hooks/useRequireAuth.ts`) rather than calling `navigate` during render.

### shadcn/ui
- Config: `components.json` | Components: `src/components/ui/`
- Add: `npx shadcn@latest add [component-name]`

## Database (Convex)

### Schema (`convex/schema.ts`)
- **Tables**: users, chatSessions, messages, matches, chatRequests
- **No migrations**: Schema changes auto-applied by Convex
- **Key indexes**: `by_clerk_id`, `by_queue`, `by_chat_and_time`, `by_to_user_and_status`
- See `convex/schema.ts` for full schema

### Convex Function Types
- **Queries** (read-only): Use for fetching data
- **Mutations** (writes): Use for creating/updating/deleting
- **Actions** (external APIs): Use for third-party API calls
- **HTTP Actions** (webhooks): See `convex/http.ts` for Clerk webhook handler

### Message Privacy & ID Comparison
- **Privacy**: All messages deleted when chats end (see `convex/messages.ts` leaveChat)
- **CRITICAL**: Always compare Convex IDs to Convex IDs (never mix with Clerk IDs)
- Backend returns `currentUserId` (Convex ID) for message ownership comparison

## Authentication (Clerk)

### Setup
- **Required env vars**: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CONVEX_URL`
- **Config file**: `convex/auth.config.js` (Clerk domain + applicationID: "convex")
- **JWT Template**: Add custom claims for user data
  - In Clerk Dashboard → JWT Templates → Edit Convex template
  - Add: `{"username": "{{user.username}}"}`
  - Required for `identity.username` to be available in Convex functions
- **Webhook** (optional): Set `CLERK_WEBHOOK_SECRET` in Convex Dashboard
  - URL: `https://YOUR-DEPLOYMENT.convex.site/clerk-webhook`
  - Events: `user.created`, `user.updated`, `user.deleted`
  - Handler: `convex/http.ts` with Svix signature verification

### Key Patterns
- **Clerk components**: Use `routing="hash"` (NOT `routing="path"`) to avoid 404s
- **User sync**: Rely on webhooks for user creation (removed `getOrCreateCurrentUser` auto-creation to prevent deleted users from recreating)
- **Frontend**: `useUser()` hook from `@clerk/tanstack-react-start`
- **Backend**: `ctx.auth.getUserIdentity()` returns Clerk identity with `.subject` (Clerk ID)

### User Deletion Pattern (Important!)
**DO NOT auto-create users** - deleted users should stay deleted:
```typescript
// ❌ BAD: Auto-creates deleted users
useEffect(() => {
  if (!userExists) {
    await getOrCreateUser({})
  }
})

// ✅ GOOD: Show error for deleted users
if (queueStatus && !queueStatus.userExists) {
  return <div>Account Not Found - Sign Out</div>
}
```

**Cascade deletion order** (convex/users.ts `deleteFromClerk`):
1. Delete messages where `senderId = user._id`
2. Delete matches where `user1Id = user._id` OR `user2Id = user._id`
3. Delete chat sessions where `user1Id = user._id` OR `user2Id = user._id`
4. Finally delete user

## Design System

### Theme: Minimalist Black & White with 3D Shadows
- No gradients, black/white only, hard-edge shadows (not soft)
- Custom utilities: `.shadow-3d`, `.shadow-3d-sm`, `.shadow-3d-lg`, `.hover-lift`
- Buttons: 2px border + 4px shadow, press = translate(2px, 2px)
- Inputs: 2px border + 4px shadow, focus = 6px shadow + translate(-1px, -1px)

## Implementation Status

### ✅ Completed
- Core features: Auth, matching queue, 15-min speed dating, decision mechanism, extended chat
- **Persistent chats**: WhatsApp-style always-available chats after matching (no chat requests)
- **E2EE encryption**: End-to-end encrypted messages in matched chats (libsodium X25519 + XSalsa20-Poly1305)
- **Report system**: Users can report messages - includes decrypted content for admin review
- **Cut connection**: Either user can end a chat - kicks out other user with toast notification
- **Inline profile reveal**: Profile card appears in chat message stream when matched
- **Smart scroll**: `use-stick-to-bottom` - no auto-scroll, "New messages" indicator
- **Decision timeout**: 30-second timeout if one user doesn't respond
- **Cancel decision**: Change your mind while waiting for other user
- Security: Webhook signature verification, race condition prevention, rate limiting, input validation
- Privacy: Message auto-deletion on chat end or cut connection, E2EE for matched chats
- Performance: Query limiting, optimized re-renders, proper React patterns
- User management: Username display priority, cascade deletion from Clerk → Convex, deleted user error handling
- Profile editing with photo upload (`profile.tsx`, `convex/profile.ts`)
- Notifications page for pending chat requests (`notifications.tsx`)
- Skip feature: Both users can skip speed dating → direct to extended phase
- Typing indicators with 5-second timeout
- Auto-redirect on match found

### 🚧 Todo
- Phase 2 profile visibility (`profile/$userId.tsx` placeholder exists)
- Read receipts
- Settings page
- Report/block system
- Typing indicator cleanup via scheduled functions
- Unread message count per chat

## Key Files Reference
- **Backend**: `convex/schema.ts`, `convex/users.ts`, `convex/queue.ts`, `convex/messages.ts`, `convex/decisions.ts`, `convex/http.ts`, `convex/matches.ts`, `convex/chatRequests.ts`, `convex/profile.ts`, `convex/encryption.ts`, `convex/reports.ts`
- **Frontend Routes**: `src/routes/__root.tsx`, `src/routes/dashboard.tsx`, `src/routes/chat/$chatId.tsx`, `src/routes/matches.tsx` (Chats page), `src/routes/notifications.tsx`, `src/routes/profile.tsx`
- **Chat Components**: `src/components/chat/ChatMessages.tsx` (uses stick-to-bottom, E2EE decryption), `src/components/chat/InlineProfileCard.tsx`, `src/components/chat/DecisionOverlay.tsx` (with cancel/timeout), `src/components/chat/ReportDialog.tsx` (message reporting)
- **E2EE**: `src/lib/encryption.ts` (libsodium crypto), `src/lib/keyStorage.ts` (IndexedDB), `src/hooks/useEncryption.ts` (React hook)
- **Chat List**: `src/components/matches/ChatListCard.tsx` (WhatsApp-style chat preview with cut connection)
- **Config**: `src/styles/app.css`, `vite.config.ts`, `convex/auth.config.js`

## Critical Lessons Learned

### 1. Never Mix ID Types
**Problem**: Messages appeared on wrong side
**Cause**: Compared `message.senderId` (Convex ID) with `user?.id` (Clerk ID)
**Fix**: Backend returns `currentUserId` (Convex ID) for comparison

### 2. Clerk Routing
**Use**: `routing="hash"` (NOT `routing="path"`) to avoid 404s on callbacks
**Add**: `signInFallbackRedirectUrl="/dashboard"` to `ClerkProvider`

### 3. Convex Auth Config
**Required**: `convex/auth.config.js` with Clerk domain + Convex JWT template
**Deploy**: `npx convex deploy -y` after creating auth config

### 4. Index Names
**Always** check `convex/schema.ts` for exact index names (e.g., `by_chat_and_time` not `by_session`)

### 5. Privacy by Default
Messages deleted on chat end in `convex/messages.ts` (leaveChat) and `convex/decisions.ts` (makeDecision)

### 6. Username Priority in JWT Template
**Problem**: Convex stored "First Last" instead of username
**Cause**: `identity.username` not included in default Clerk JWT claims
**Fix**: Add custom claim in Clerk JWT template: `{"username": "{{user.username}}"}`
**Priority order**: `username` → `givenName` → `name` → `nickname` → "User"

### 7. User Deletion Must Cascade
**Problem**: User deletion failed, user auto-recreated after deletion
**Cause**: Related data (messages, matches, sessions) blocked deletion + `getOrCreateCurrentUser` ran on page load
**Fix**:
- Cascade delete: messages → matches → chat sessions → user (in that order)
- Remove auto-creation logic from `dashboard.tsx`
- Show "Account Not Found" error for deleted users instead of recreating them

### 8. Webhook URL Pattern
**Problem**: Webhooks returned 404
**Cause**: Used `.cloud` domain instead of `.site`
**Fix**: Convex HTTP routes deploy to `https://[deployment].convex.site/[path]` (NOT `.cloud`)
**Important**: Run `npx convex dev` to deploy HTTP routes to dev deployment

### 9. React Function Initialization Order
**Problem**: "Cannot access before initialization" error
**Cause**: Function used in early return before being defined
**Fix**: Define all handler functions BEFORE any conditional returns/JSX that use them

## Troubleshooting
- **401 errors**: Check Clerk JWT template + `convex/auth.config.js` + deploy auth config
- **Messages on wrong side**: Backend must return `currentUserId` (Convex ID)
- **404 on callbacks**: Use `routing="hash"` in Clerk components
- **404 on webhooks**: Use `.site` not `.cloud` + ensure `npx convex dev` is running
- **Index errors**: Verify exact index name in `convex/schema.ts`
- **Wrong username displayed**: Add `username` to Clerk JWT template custom claims
- **User auto-recreates after deletion**: Remove `getOrCreateCurrentUser` from dashboard
- **User deletion fails**: Check cascade deletion order (messages → matches → sessions → user)
- **Function initialization error**: Move function definitions before early returns

## Security & Performance (Production-Ready)

### Security Implementations
1. **Webhook verification** (`convex/http.ts`): Svix signature validation (requires `npm install svix` + `CLERK_WEBHOOK_SECRET`)
2. **Race condition prevention** (`convex/queue.ts`): "Claim-first, verify-second" pattern in matching
3. **Query limits** (`convex/messages.ts`): Use `.take(200)` instead of `.collect()`
4. **Input validation**: Max 2000 chars, rate limit 10 msgs/10sec
5. **Active session check**: Prevent queue join during active chat

### Performance Optimizations
1. **useEffect ref pattern**: Use `useRef` to prevent infinite loops (see `dashboard.tsx`)
2. **Timer optimization**: Only update state when value changes (reduces 60 re-renders/min → 1)
3. **Error boundaries**: Handle loading/error states gracefully in `chat/$chatId.tsx`

### Production Checklist
- [ ] Set `CLERK_WEBHOOK_SECRET` in Convex Dashboard
- [ ] Configure webhook URL: `https://YOUR-DEPLOYMENT.convex.site/clerk-webhook` (use `.site` not `.cloud`)
- [ ] Enable webhook events: `user.created`, `user.updated`, `user.deleted`
- [ ] Add `username` to Clerk JWT template: `{"username": "{{user.username}}"}`
- [ ] Test: webhook verification, user creation, user deletion, username display
- [ ] Test: race conditions, rate limiting, error states
- [ ] Verify deleted users cannot recreate themselves
