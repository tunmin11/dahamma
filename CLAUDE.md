# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack disabled, uses --webpack) at localhost:3000
npm run build    # Production build (--webpack)
npm run start    # Start production server
npm run lint     # ESLint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test suite configured in this repo.

## Architecture

This is a Next.js 16 App Router PWA ("Paritta Pali") — a Buddhist chanting/practice companion app, all client-rendered (nearly every page/component is `"use client"`). All routes and shared code live under `app/`, no `src/` directory; `@/*` path alias maps to the repo root.

**Auth & data layer**: Firebase is initialized once in `app/firebase/config.ts`, guarded so a missing `NEXT_PUBLIC_FIREBASE_*` env var (see `.env.local`) doesn't break the build — it falls back to a mock `auth`/`db` object instead of throwing. `app/context/AuthContext.tsx` wraps the app (via `app/ClientLayout.tsx` in `app/layout.tsx`) with an `AuthContextProvider` exposing `useAuth()` (Google sign-in via `signInWithPopup`, sign-out, current user, loading state). Firestore is used with a named database (`"dhamma-app"`), not the default one. Any code touching `auth`/`db` should check `auth.app` is truthy first, following the existing pattern, since both can be the mock object.

**Feature areas** (each is a top-level route under `app/`):
- `paritta/` — the 11 major Pali suttas: list (`SuttaList`), text reader (`SuttaReader`), and `AudioPlayer`. Sutta metadata lives in `app/data/suttas.ts`; actual chant text is split per-sutta under `app/data/texts/*.ts` and looked up via `app/data/sutta-texts.ts` (`getSuttaText`).
- `nawin/` — a 9-level, 9-day-per-level chanting ritual tracker. The day/level/mantra schedule is static data in `app/data/nawinMatrix.ts` (`NAWIN_DATA`); `app/utils/nawinLogic.ts` (`getNawinDayInfo`) derives the current level/day/mantra/rounds from a raw day-of-ritual number (`ceil(day/9)` for level, `(day-1)%9` for session index). `NawinPath`/`NawinCounter`/`NawinTable` render this. Progress counts read/write through the Firestore `db`.
- `pahtan/` — Patthana text reader; data in `app/data/pahtan.ts` plus reference markdown (`app/data/patthana_manual_raw.md`, `app/data/patthana_pali.md`) not directly imported into the UI.
- `phayar-shit-khoe/` — standalone devotional text page, data in `app/data/texts/phayar-shit-khoe.ts`.
- `library/` — simple hub linking to the above feature routes.

**Content is largely Burmese-language static data** embedded directly in `.ts` files (not fetched from a CMS/API) — when adding or editing chant/ritual content, edit the relevant file under `app/data/` rather than looking for a backend.

**PWA**: configured via `@ducanh2912/next-pwa` in `next.config.ts`, disabled in development (`disable: process.env.NODE_ENV === "development"`), service worker/manifest output to `public/`.

## Environment variables

Firebase config is read from `NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,STORAGE_BUCKET,MESSAGING_SENDER_ID,APP_ID}` (see `.env.local`, not committed). The app is designed to still build/run without these set.
