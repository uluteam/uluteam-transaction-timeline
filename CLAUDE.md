# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This repo contains exactly one tracked file: `index.html`. There is no `package.json`, no build config, no tests, no lint config, no `src/` tree. The Netlify deploy serves `index.html` verbatim. Git history shows updates land via "Add files via upload" rather than in-repo edits — assume the working source of truth lives outside this repo and gets re-uploaded.

## How `index.html` is structured

`index.html` is a self-contained bundle. The first ~165 lines are a hand-written "bundler" runtime; everything after is data:

- `<script type="__bundler/manifest">` (line ~169) — a JSON object keyed by UUID. Each entry is `{ mime, compressed, data }` where `data` is base64 of a gzipped asset. Contains React 18.3.1 dev, react-dom dev, Babel standalone, 13 woff2 font files, and 22 `application/javascript` JSX modules.
- `<script type="__bundler/ext_resources">` (line ~172) — typically `[]`.
- `<script type="__bundler/template">` (line ~176) — a JSON-string-escaped HTML document. References to manifest assets appear as bare UUIDs (e.g. `<script src="0bd566fa-...">`); the runtime does string-replacement of UUIDs with blob URLs before parsing.

At runtime the inline script:
1. Decodes each manifest entry, gunzips via `DecompressionStream`, and creates `URL.createObjectURL` blob URLs.
2. Substitutes UUIDs in the template, strips `integrity`/`crossorigin` (blob URLs from a `file://` doc trip SRI), parses the result with `DOMParser`, and `replaceWith`s `document.documentElement`.
3. Re-creates every `<script>` (DOMParser-inserted scripts are inert) in order, inlining the source for `text/babel` scripts that have a `src` (XHR against `blob:null/...` is silently dropped on `file://`), then calls `Babel.transformScriptTags()` manually because the auto-trigger fired before the swap.

Practical consequence: the file works when opened directly with `file://` — no server required.

## App architecture (the JSX inside the manifest)

The app is React 18 with hash routing and Babel-standalone in-browser JSX. The 22 modules in the manifest, by their leading `// filename.jsx` comments:

- **Entry**: `app.jsx` (`App`, `ScreenMap`) — top-level router. `useSidebar` is true for `/client/*`.
- **Routing/helpers**: `shared.jsx` — exposes `useState/useEffect/useMemo/useRef/useCallback` from `React` and a `useRoute()` hash-router hook (`#/client/dashboard`, `#/admin/timeline`, etc.). Also defines shared primitives `Chip`, `Card`, `PropertyPlaceholder`, `Check`, `Toggle`, `Onward`. Loaded first; later modules assume these are global.
- **Visual primitives**: `icons.jsx` (single `Icon` component, stroke icons at 18px default), `logos.jsx` (`UluLogo`, `UluMark`, `GemLogo`).
- **Buyer portal** (`/client/*`, rendered inside `Sidebar` from `sidebar.jsx`): `login.jsx`, `dashboard.jsx`, `transaction.jsx` (milestones), `preapproval.jsx` (GEM Mortgage), `documents.jsx`, `calendar.jsx`, `messages.jsx`, `settings.jsx`, `saved.jsx`.
- **Admin** (`/admin/*`, no sidebar): `admin_login.jsx`, `admin_dashboard.jsx` (`AdminShell`, `TabBtn`, `AdminDashboard`, `Stat`), `admin_clients.jsx`, `add_client_modal.jsx`, `timeline_editor.jsx` (the hero sheet view; `TimelineEditor`, `DateField`, `Field`, `PartyRow`, `Legend`, `TimelineSection`, `TimelineRow`).
- **Email previews** (`/email/*`, no sidebar): `email_magic.jsx`, `email_gem.jsx`.
- **Dev panel**: `tweaks.jsx` — IIFE that injects a floating "Tweaks" panel (color picker for accent red, toggles). Reads/writes `window.__TWEAKS__`; e.g. `timeline_editor.jsx` checks `window.__TWEAKS__?.showTCDirections`.

Module order in the template matters: React → ReactDOM → Babel → `shared.jsx` → primitives → screens → `app.jsx` last. There is no module system — each file declares top-level `function`s/`const`s that become global via Babel's transform.

Styling is inline `style={{...}}` with a small set of CSS custom properties (`--red`, `--red-wash`, etc.) defined in the template's `<style>` block. Fonts are Playfair Display (italic + regular, multiple unicode ranges) loaded from the manifest as woff2 blobs.

## Editing workflow (important)

You **cannot** meaningfully edit a JSX module by editing `index.html` with `Edit`/`Write` directly — the source is gzipped+base64'd inside the manifest. To change app code you must:

1. Read line 169 (the manifest), `JSON.parse` it, `base64`-decode and `gzip`-decompress the target entry, edit the JSX text, re-gzip (`gzip.compress`), re-base64, write the entry back, and rewrite line 169.
2. Confirm `entry.compressed === true` is preserved and the `mime` is unchanged (`application/javascript` for JSX, `text/javascript` for the React/Babel libs).
3. If you change the set of modules referenced from the template, also update line 176 (the template) — UUIDs there must match manifest keys.

If asked to make a non-trivial change to the React app, surface this constraint to the user before attempting it: the upstream workflow is to regenerate the bundle externally and re-upload, not to hand-patch the manifest. Confirm the user wants in-repo manifest surgery before doing it.

For trivial changes outside the manifest (the bundler runtime itself, `<title>`, the loading SVG/styles in lines 1–166), normal `Edit` works fine.

## Inspecting the bundle

To list/decode manifest entries from the shell:

```bash
awk 'NR==169' index.html | python3 -c "
import sys, json, base64, gzip
m = json.loads(sys.stdin.read())
for k, v in m.items():
    if v['mime'].endswith('javascript'):
        raw = base64.b64decode(v['data'])
        if v.get('compressed'): raw = gzip.decompress(raw)
        print('===', k, v['mime'], len(raw)); print(raw[:200].decode('utf-8','replace'))
"
```

The template lives on line 176 and is a JSON-encoded string; `json.loads` it before reading.

## Running / verifying

Open `index.html` directly in a browser (`file://` is supported by design). There is no dev server, no test runner, no linter. The bundler displays an "Unpacking..." status and surfaces uncaught errors in a fixed bottom-left red panel (`#__bundler_err`) — check it after any change.

## Branch convention

Per the harness instructions, develop on the designated feature branch (currently `claude/add-claude-documentation-TEm3N`), commit with descriptive messages, and push with `git push -u origin <branch>`. Never push to `main`.
