# Cup Trail

Cup Trail is a cross‑platform app for discovering and reviewing drinks at cafés. Search shops, log reviews with ratings and photos, and browse recent activity.

## Features
- Discover shops and drinks via Google Places
- Add reviews (rating, comment, photos, videos)
- Auto-suggest drink categories and filter shops by category
- Web and mobile apps powered by a shared core

## Tech Stack
- Web: React + Vite
- Mobile: React Native (Expo)
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- APIs: Google Maps API
- Shared: TypeScript monorepo (pnpm workspaces)

## Monorepo Structure
```
cup-trail/
├─ apps/
│  ├─ web/                           # Vite (React) web app
│  │  ├─ src/
│  │  │  └─ components/
│  │  │     ├─ App.tsx
│  │  │     ├─ SearchPage.tsx        # Home Page
│  │  │     ├─ StorefrontPage.tsx  
│  │  │     └─ InsertReviewPage.tsx
│  │  ├─ vite.config.ts              # Vite config + package aliases
│  │  └─ tsconfig.json
│  └─ mobile/                        # Expo (React Native) app
│     ├─ app/
│     │  ├─ _layout.tsx
│     │  ├─ index.tsx
│     │  ├─ storefront/[shopId].tsx
│     │  └─ review/[shopId].tsx
│     ├─ components/MediaPreview.tsx # Custom React Component
│     ├─ storage/uploadMedia.ts      # Supabase storage helpers
│     ├─ constants/index.ts
│     ├─ app.json
│     └─ metro.config.js
├─ packages/
│  ├─ core/                          # Business/data layer (shared)
│  │  ├─ types.ts                    # Shared types (Result, rows, etc.)
│  │  ├─ constants.ts                # Shared constants (RATING_SCALE, endpoints)
│  │  ├─ drinks.ts                   # Drinks + shop_drinks queries/mutations
│  │  ├─ reviews.ts                  # Reviews queries/mutations
│  │  ├─ shops.ts                    # Shop lookup/insert
│  │  ├─ categories.ts               # Category set/get and shop filtering
│  │  └─ index.ts                    # Public exports
│  └─ utils/                         # Cross-platform utilities
│     ├─ env.ts                      # Platform-aware env (web/mobile)
│     ├─ supabaseClient.ts           # Shared Supabase client
│     ├─ maps.ts                     # Maps (autocomplete/details via Edge Function)
│     ├─ categorizeDrinks.ts         # Keyword → category suggestions
│     └─ index.ts                    # Public exports
├─ tsconfig.base.json                # TS base config (paths for @cuptrail/*)
├─ eslint.config.js                  # Monorepo ESLint config
├─ pnpm-workspace.yaml               # Workspace packages
├─ package.json                      # Root scripts (dev, lint, typecheck)
└─ README.md
```
## 🛠️ Setup Instructions

1. **Clone the repo**
```
git clone https://github.com/Cup-Trail/cup-trail.git
cd cup-trail
```
2. **Install dependencies**
Prerequisites:
- Node 18+
- pnpm 10+
- Supabase project (URL + anon key)
```
pnpm install
```

1. **Set up environment variables**
Create a .env file in the each respective app:

apps/mobile/.env

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
apps/web/.env

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Run the app**
- mobile: `pnpm run dev:mobile`
- web: `pnpm run dev:web`

5. **Run linter**
From repo root:
- Lint all: `pnpm lint`
- Fix lint: `pnpm lint:fix`
- Typecheck: `pnpm typecheck`

## Meet the Team
This project wouldn't have been possible without the creativity, technical skill, and thoughtful feedback of the following team members:

[Katherine Wong] – Full-stack Developer 

[Ly Nguyen] – Frontend Developer

[Tracy Nguyen] – UI/UX Designer
