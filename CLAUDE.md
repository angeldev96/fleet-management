# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Project Overview

Entry is a fleet intelligence platform built with React 18 + Vite + Tailwind CSS v4 + shadcn/ui. It tracks vehicles in real-time, detects driving events, and displays OBD-II diagnostics. The backend is Supabase (PostgreSQL with RLS for multitenancy).

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.


### Supabase Project

| | Production (main) | Development (dev) |
|---|---|---|
| **Project name** | Entry | Entry (branch) |
| **Project ref** | `aihbduyzmxjfyjltzqyo` | `qhsquyccwnmyxpgfigru` |
| **Region** | us-west-2 | — |

We are currently working on the **dev branch** (`qhsquyccwnmyxpgfigru`). All edge functions and migrations should target this branch during development.

#### Edge Functions (on dev branch)
- **`telemetry-ingest`** — Main ingestion endpoint for all telemetry events. Handles normalization, alarm reclassification, rate limiting, PID extraction, and vehicle/device state updates. Auth via `X-API-Key` header.
- **`telemetry-gps-ingest`** (v1) — Lightweight endpoint that only derives PID readings from GPS payloads (`location_update`, `device_online`, `device_offline`). Does not insert the original event.

## Commands

```bash
npm install --legacy-peer-deps     # Install dependencies (--legacy-peer-deps may be needed for some packages)
npm run dev                        # Vite dev server on localhost:5173
npm start                          # Alias for npm run dev
npm run build                      # Vite production build (output: dist/)
npm run preview                    # Preview production build
npm run lint:check                 # ESLint check
npm run lint:fix                   # ESLint auto-fix
npm run format                     # Prettier format
npm run simulator                  # GPS/telemetry simulator for testing
```

## Architecture

### Tech Stack
- **React 18** with Vite 6 (`@vitejs/plugin-react-swc`)
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **shadcn/ui** (new-york style) — components in `src/components/ui/*.tsx`
- **Lucide React** for icons
- **Sonner** for toast notifications
- **Supabase v1.x** (`@supabase/supabase-js` 1.35.7) — uses legacy v1 auth API (`supabase.auth.signIn()`, `supabase.auth.session()`, NOT v2's `signInWithPassword`)
- **Mapbox GL** for fleet map visualization
- **React Router v5** for routing

### Import Aliases
`vite.config.mjs` and `tsconfig.json` set path aliases with `baseUrl: "src"`, so all imports are relative to `src/`:
```javascript
import { useAuth } from "context/AuthContext";
import { supabase } from "lib/supabase";
import { cn } from "lib/utils";
```

### Data Flow: Services → Hooks → Views

```
src/lib/supabase.js          Supabase client singleton
src/services/*Service.js      Thin wrappers for Supabase CRUD operations
src/hooks/use*.js             Data fetching hooks with polling (30s default), pagination, error handling
src/views/*/                  Page components that consume hooks
src/components/*/             Reusable presentational components (Card, Table, Badge, etc.)
```

### State Management
No Redux/Zustand. Uses **React Context + custom hooks**:
- `context/AuthContext.js` — user session, profile (with fleet_id and role), auth methods
- `context/NotificationContext.js` — toast notification system via Sonner (`showNotification({ title, subtitle, color })`)
- `hooks/use*.js` — each returns `{ data, loading, error, refetch }` pattern

### Authentication & Multitenancy
- `AuthContext` provides: `user`, `userProfile`, `fleetId`, `isSuperAdmin`, `isAdmin`, `signIn`, `signOut`
- User profiles have a `fleet_id` linking them to a tenant
- RLS policies on all tables enforce fleet isolation at the database level
- Roles: `superadmin` (bypasses fleet filter), `admin`, `user`, `viewer`
- All `/admin/*` routes are wrapped in `ProtectedRoute`

### Routing
Routes defined in `src/routes.js` as a flat array. Each route has `{ path, component, layout, icon, hide }`. Layout is either `/admin` (dashboard shell) or `/auth` (login/register). Routes with `hide: true` don't appear in the sidebar.

Layouts in `src/layouts/`:
- `Admin.js` — sidebar + navbar + content area; also hosts real-time alert listener
- `Auth.js` — login/register pages

### Custom Hooks Pattern
All data hooks follow the same pattern:
```javascript
export function useHook({ fleetId, refreshInterval = 30000, page, pageSize, ...filters } = {}) {
  // useState for data, loading, error
  // useRef(true) for isMounted tracking (memory leak prevention)
  // useCallback for fetch function
  // useEffect for polling setup/teardown
  // Returns { data, loading, error, totalCount, refetch }
}
```

Hooks read `fleetId` from `useAuth()` by default. Superadmins skip fleet filtering.

### Database Schema
```
fleets → user_profiles (auth user → fleet mapping)
       → vehicles (with fleet_id isolation)
           → devices (1:1 per vehicle, linked by IMEI)
               → events (telemetry: location, speed, collisions, DTCs, PIDs)
```
The `vehicles_with_status` view pre-calculates online/idle/offline status with `security_invoker = true` for RLS.

### Key Constants
`src/types/database.js` contains JSDoc types and shared constants: `EVENT_LABELS`, `PID_LABELS`, `SEVERITY_COLORS`, `STATUS_COLORS`, plus formatting utilities (`formatDateTime`, `formatRelativeTime`, `getVehicleStatus`).

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_MAPBOX_ACCESS_TOKEN_PUBLIC
```

## Conventions

- **Supabase v1 API**: Do NOT use v2 patterns. Auth uses `.signIn()` / `.session()`, not `.signInWithPassword()` / `.getSession()`.
- **Liability-safe wording**: Event labels use careful language (e.g., "Potential Collision Detected", "Speed Threshold Exceeded"). See `EVENT_LABELS` in `types/database.js`.
- **Excluded event types**: `location_update`, `device_offline`, `device_online`, `power_event` are filtered out of event/alert feeds.
- **Prettier config**: 100 char width, double quotes, trailing commas (es5), no tabs.
- **File naming**: PascalCase for components, camelCase for hooks/services/utils.
- **Styling**: Use Tailwind CSS utility classes. Use `cn()` from `lib/utils` for conditional class merging. shadcn/ui components live in `src/components/ui/`. CSS custom properties for theming are in `src/index.css`.
- **Icons**: Use Lucide React icons (`lucide-react`). Do NOT use `@material-ui/icons`.
- **Modals/Dialogs**: Use shadcn `Dialog` for modals, `AlertDialog` for confirmation prompts (replaces SweetAlert).
- **Toasts**: Use Sonner via `NotificationContext` (`showNotification()`). Do NOT use MUI Snackbar.
