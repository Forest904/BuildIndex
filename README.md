# BuildIndex - Device Orbits

Solar-system-inspired device spec explorer. Next.js (App Router) + TypeScript + Tailwind v4, with Prisma/SQLite for data, Sketchfab Viewer API for 3D embeds, and TechSpecs as the upstream specs source.

## Stack
- Next.js 16, React 19, TypeScript
- Tailwind CSS v4 (dark/space theming)
- Prisma + SQLite (seeded demo data)
- Zustand for shared state (search/selection/orbit controls)
- Sketchfab Viewer API (iframe) for 3D, TechSpecs API for specs enrichment
- Auth: bcrypt-hashed passwords + cookie sessions (Prisma Session table)

## Structure
- `src/app` - routes (home, auth pages, API routes)
- `src/domain` - domain models
- `src/features/device` - mock data, stores, TechSpecs client
- `src/features/layout` - header/search
- `src/features/visualization` - Sketchfab viewer + orbiting spec cards + orbit controls store
- `prisma` - schema + seed

## Setup
1) Create `.env.local` (or `.env`) and set:
   - `DATABASE_URL` (defaults internally to `file:./prisma/dev.db` for local SQLite)
   - `TECHSPECS_API_KEY` (for remote enrichment in `/api/devices/search`)
   - `SKETCHFAB_TOKEN` and `NEXT_PUBLIC_SKETCHFAB_TOKEN` (viewer access)
2) Sync DB + seed demo data:
   ```bash
   npm run db:push -- --accept-data-loss
   npm run db:seed
   ```
3) Dev server:
   ```bash
   npm run dev
   ```

## API endpoints
- `GET /api/devices/search?query=` - DB-first search, enrich via TechSpecs (persisting matches), mock fallback
- `GET /api/devices/[id]` - DB device + categories/specs (mock fallback)
- `POST /api/auth/register` - create user + session cookie
- `POST /api/auth/login` - login + session cookie
- `POST /api/auth/logout` - clear session
- `GET /api/auth/me` - current user (401 if none)
- `GET/POST/DELETE /api/favorites` - list/add/remove favorite devices (auth required)

## External providers
- Specs: TechSpecs API (enrichment is lazy during search and persisted to SQLite)
- 3D: Sketchfab Viewer API iframe embed (no file downloads). Provide `sketchfabUid` per device + token for private models.

## Auth
- Passwords hashed with bcryptjs
- Sessions stored in Prisma `Session` table, cookie `bi_session` (httpOnly, sameSite=lax)

## Orbit controls
- Live speed + ellipse sliders (Zustand) affect all orbiting spec cards; hover a card to pause its orbit.

## Next steps
- Broaden TechSpecs enrichment (pull spec fields) and map to category slots.
- Display auth state in header + enable favourites UI.
- Refine orbit paths and add R3F-powered effects/particles.
