# Markd — Smart Bookmark Manager

A real-time bookmark manager built with Next.js App Router, Supabase, and Tailwind CSS. Users log in with Google OAuth, save private bookmarks, and see changes sync instantly across all tabs.

## Live Demo

> Add your Vercel URL here after deployment

## Features

- **Google OAuth only** — No email/password, single-click sign in
- **Private bookmarks** — Row Level Security ensures users only see their own data
- **Real-time sync** — Supabase Realtime pushes INSERT/DELETE events to all open tabs instantly
- **Add & delete** — Full CRUD with confirmation prompt before deletion
- **Search** — Client-side filtering by title or domain
- **Responsive** — Works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL + RLS) |
| Realtime | Supabase Realtime (postgres_changes) |
| Styling | Tailwind CSS + custom CSS variables |
| Deployment | Vercel |

---

## Setup Guide

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app
cd smart-bookmark-app
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings → API**
3. Copy your **Project URL** and **anon/public** key

### 3. Configure environment variables

Create a `.env.local` file in the root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the database schema

In the Supabase dashboard, go to **SQL Editor** and run the contents of `supabase-schema.sql`. This will:

- Create the `bookmarks` table
- Enable Row Level Security (RLS)
- Create policies so users only access their own data
- Enable Realtime on the table

### 5. Enable Google OAuth in Supabase

1. Go to **Authentication → Providers → Google**
2. Enable it and add your **Google Client ID** and **Client Secret**
3. To get these, go to [Google Cloud Console](https://console.cloud.google.com):
   - Create a new project (or use existing)
   - Go to **APIs & Services → Credentials**
   - Create **OAuth 2.0 Client ID** (Web Application)
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel

1. Push your code to a public GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables in Vercel settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!
5. After deployment, add your Vercel URL to Supabase:
   - **Authentication → URL Configuration → Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`
6. Also add the Vercel URL to your Google OAuth authorized origins

---

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts   # OAuth callback handler
│   ├── dashboard/page.tsx       # Protected dashboard (server component)
│   ├── login/page.tsx           # Login page
│   ├── globals.css              # Global styles + animations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Root redirect
├── components/
│   ├── AddBookmarkForm.tsx      # Form to add a new bookmark
│   ├── BookmarkCard.tsx         # Individual bookmark with delete
│   ├── BookmarkDashboard.tsx    # Main dashboard (realtime client)
│   └── LoginButton.tsx          # Google OAuth button
├── lib/supabase/
│   ├── client.ts                # Browser Supabase client
│   └── server.ts                # Server-side Supabase client
└── middleware.ts                # Session refresh + route protection
```

---

## How Realtime Works

The `BookmarkDashboard` component subscribes to `postgres_changes` on the `bookmarks` table filtered by the current user's ID:

```typescript
supabase
  .channel('bookmarks-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${user.id}`,
  }, (payload) => {
    setBookmarks(prev => [payload.new, ...prev])
  })
  .on('postgres_changes', {
    event: 'DELETE',
    ...
  }, (payload) => {
    setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
  })
  .subscribe()
```

When a bookmark is added in Tab A, Supabase pushes the event over WebSocket to Tab B, which updates state instantly — no polling, no page refresh.

---

## Problems Encountered & Solutions

### 1. Supabase SSR cookie handling in Next.js 14

**Problem**: The `@supabase/auth-helpers-nextjs` package wasn't compatible with Next.js 14's App Router and async `cookies()` API. Session cookies weren't persisting correctly.

**Solution**: Switched to `@supabase/ssr` package which provides `createServerClient` and `createBrowserClient` designed specifically for the App Router. Middleware was added to refresh sessions on every request, keeping auth state in sync.

### 2. Realtime duplicate events on insert

**Problem**: When a user adds a bookmark, both the optimistic UI update AND the Supabase Realtime INSERT event would fire, causing duplicate entries in the list.

**Solution**: Added deduplication in the realtime handler:
```typescript
setBookmarks(prev => {
  if (prev.some(b => b.id === payload.new.id)) return prev
  return [payload.new, ...prev]
})
```
Also on `onAdd` from the form, duplicates are checked before prepending.

### 3. Google OAuth redirect URI mismatch

**Problem**: After deploying to Vercel, the OAuth callback returned an error because the production URL wasn't in the authorized redirect list.

**Solution**: Added both the Supabase callback URL (`https://project.supabase.co/auth/v1/callback`) AND the app's own callback (`/auth/callback`) to both the Google Cloud Console authorized redirect URIs and Supabase's redirect URLs list.

### 4. Row Level Security blocking realtime

**Problem**: Even with RLS policies set up, the Realtime subscription wasn't receiving events initially.

**Solution**: The `bookmarks` table needed to be added to the Supabase Realtime publication. This is done via the SQL command:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
```
This step is easy to miss if you only set up RLS policies.

### 5. Middleware interfering with static assets

**Problem**: The middleware was running on all routes including `_next/static` files, causing slowdowns.

**Solution**: Added a proper `matcher` config to the middleware to exclude static files and images:
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## License

MIT
