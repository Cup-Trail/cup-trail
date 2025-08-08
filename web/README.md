## Cup Trail — Web

React + Vite + Material UI port of the mobile app screens.

### Env

- Create a `.env` file in `web/` with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run

```
npm install
npm run dev
```

### Build

```
npm run build && npm run preview
```

### TypeScript, Linting & Formatting

- Type check:

```
npm run typecheck
```

- Lint (ESLint):

```
npm run lint
npm run lint:fix
```

- Format (Prettier):

```
npm run format
```

Notes:

- ESLint is configured for React + TypeScript with import ordering and React Hooks rules.
- Auto-fix on save (VS Code): `.vscode/settings.json` enables ESLint fixes, import organize, and Prettier.
- We’ve relaxed a few strict rules (like no-explicit-any) for easier migration; tighten later if desired.

### Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that deploys `web/dist` to GitHub Pages on pushes to `main`.

Steps:

- Enable Pages: Settings → Pages → Source: GitHub Actions
- Push to `main` (or run the workflow manually)

For project pages (non-`<user>.github.io` repos), the base path is set automatically during CI, and SPA fallback is handled by copying `index.html` to `404.html`.

### Versioning & Changelog

- Conventional Commits recommended (feat:, fix:, chore:, docs:, refactor:, perf:, test:)
- Generate version + CHANGELOG using standard-version:

```
npm run release            # prompts based on conventional commits
npm run release:patch      # 0.0.x
npm run release:minor      # 0.x.0
npm run release:major      # x.0.0
```

After running, commit and push tags:

```
git push --follow-tags
```
