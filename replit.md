# Challenge Corrézien — Disc-Golf Briviste

## Overview

Full-stack competition management website for the Challenge Corrézien disc-golf event organized by the Association du Disc-Golf Briviste (DGB). Black and white modern design, responsive for mobile and desktop.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: challenge-correzien, preview path: /)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Session**: express-session (SHA256 hashed password for admin auth)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Admin Credentials

- Username: `dgb`
- Password: `briveperrieres`
- Password stored as SHA256 hash in source code

## Features

### Public Site
- Homepage with year selector (dropdown, 2026+)
- Table 1 "Classement par étapes": Position, Joueur, score/diff/points per stage, total points
- Table 2 "Classement cumulé": Position, Joueur, Score total, Par total, Différence, Points
- CSV export button

### Admin Interface (/admin/login)
- Secure login (session-based)
- Player management (CRUD)
- Stage management (per year, with name/location/date/par/order)
- Score entry (per stage, per player, with auto-computed points)
- Scoring rules configuration (position -> points barème)
- Year management

## Database Schema

- `years` — competition years (2026+)
- `players` — disc-golf players
- `stages` — competition stages (linked to year, with par, order)
- `scores` — player scores per stage, with auto-computed points
- `scoring_rules` — barème: position → points (seeded: 1st=100, 2nd=90, ..., 10th=10)

## Initial Seed Data

- Year 2026
- 3 sample players: Pierre Dupont, Marie Martin, Jean Leclerc
- 10 scoring rules: positions 1-10 with points 100, 90, 80, 70, 60, 50, 40, 30, 20, 10
