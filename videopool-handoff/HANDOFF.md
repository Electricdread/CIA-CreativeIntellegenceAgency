# VideoPool — Developer Handoff

Electron + React + TypeScript desktop app that wraps `yt-dlp` for downloading, with
several in-progress creative tabs.

Version `0.1.1` (from `package.json`). This archive is source only — see
[Binaries](#binaries) and [What is not in this archive](#what-is-not-in-this-archive).

## Changes in v0.1.1

- **Removed the experimental ffmpeg encoding helper** (`encodeWithOptions` in
  `downloadManager.ts`). It was early trial-and-error code, never wired into the app
  (no IPC channel, no UI), and had several known bugs. Any future encode/upscale
  pipeline should be designed fresh rather than built on it. The v0.1.0 archive still
  contains it if you ever need the reference.
- HANDOFF updated: added the packaging gap and licensing note below; dropped the
  encode-related gaps that no longer apply.

## Setup

> **Windows-only setup scripts.** `prepare-resources.ps1` and `test_flow.ps1` are
> PowerShell. On macOS/Linux you must fetch equivalent binaries yourself and adapt
> the smoke test.

```sh
npm install
npm run prepare-resources   # downloads yt-dlp.exe + ffmpeg.exe into resources/ (Windows/PowerShell)
npx tsc                     # compile src/ -> dist/  (see Known gaps)
npm start                   # starts vite on a free port, then launches Electron against it
```

`npm run prepare-resources` fetches the two binaries the app shells out to:

- `yt-dlp.exe` — from the yt-dlp latest-release URL
- `ffmpeg.exe` — extracted from the gyan.dev `ffmpeg-release-essentials` build.
  ffmpeg is used by yt-dlp itself (merging separate audio/video streams), not by
  VideoPool's own code since v0.1.1.

## Layout

| Path | What it is |
| --- | --- |
| `src/main.ts` | Electron main process: window creation + all `ipcMain` handlers |
| `src/preload.ts` | contextBridge surface exposed to the renderer |
| `src/electron/downloadManager.ts` | Spawns `yt-dlp`, streams progress |
| `src/renderer/App.tsx` | Root UI, tab shell |
| `src/renderer/CreationTab.tsx` | Image-browsing / creation tab |
| `src/renderer/EditVideoTab.tsx` | Edit-video tab |
| `src/renderer/index.tsx` | Renderer entry |
| `scripts/start-dev.js` | Dev launcher — picks a free port, starts vite, then Electron with `VITE_DEV_SERVER_URL` |
| `scripts/prepare-resources.ps1` | Binary fetcher (see Setup) |
| `scripts/test_flow.ps1` | End-to-end download smoke test |
| `public/index.html` | Production HTML entry (loaded when `VITE_DEV_SERVER_URL` is unset — currently dev-style, see Known gaps) |
| `index.html` | Vite dev HTML entry |

## IPC surface

All handlers live in `src/main.ts`:

| Channel | Direction | Purpose |
| --- | --- | --- |
| `download:start` | invoke | Runs yt-dlp against a URL; resolves `{ outDir, files, output }` |
| `download:progress` | main → renderer | Streams `starting` / `output` / `error` / `complete` / `failed` events |
| `repo:clone` | invoke | Shells out to `gh repo clone` into `third_party/<name>` |
| `open:path` | invoke | `shell.openPath` on a repo-relative or absolute path |
| `images:list` | invoke | Recursively lists image files under a dir (default `creations/`), newest first |

## Binaries

`yt-dlp` is resolved at runtime from the first of these that exists
(`src/electron/downloadManager.ts`):

1. `process.resourcesPath/yt-dlp.exe` — packaged builds
2. `<app>/../../resources/yt-dlp.exe` — dev, relative to `dist/electron/`
3. `process.cwd()/yt-dlp.exe`

Downloads default to `~/VideoPool`, named `%(title)s [%(id)s].%(ext)s`, with `--no-playlist`.

## Known gaps

Carried over as-is; these are real and worth fixing early.

- **Packaged builds cannot work as currently wired — this is the biggest gap.**
  When `VITE_DEV_SERVER_URL` is unset (i.e. any packaged/production run), `main.ts`
  loads `public/index.html`, which references `/src/renderer/index.tsx` as a module —
  that only resolves under the Vite dev server. The `vite build` output in `dist/` is
  never loaded at all. So `npm run build` produces an app that opens to a blank
  window. Packaging needs a real production entry: point the prod window at Vite's
  built `index.html` and give the renderer bundle its own output dir (see next gap).
- **No compile script.** `package.json` `main` is `dist/main.js`, but no npm script runs
  `tsc`. `npm start` launches Electron without compiling, so a clean checkout fails until
  you run `npx tsc` manually. Worth adding a `compile` script and making `start` depend on it.
- **`dist/` is a collision.** `tsconfig.json` sets `outDir: "dist"` and `npm run build` runs
  `vite build` (which also targets `dist/` by default) before `electron-builder`. These will
  overwrite each other; split the output dirs.
- **`repo:clone` requires `gh`** on PATH and does not check for it — the spawn fails with an
  opaque error if the GitHub CLI is absent.
- **`downloadManager` completion filter assumes YouTube URLs.** It matches output files against
  `url.split('v=')[1]`, which is empty for any non-`?v=` URL and matches every file in `outDir`.
- **The preload `Window.api` type is out of date** — it omits `listImages`, so every renderer
  call site works around it with `(window as any).api` (`CreationTab.tsx`, `EditVideoTab.tsx`).
  Fixing the declared type would let the renderer use `window.api` directly under `strict`.
- **Dead channels in the preload whitelist.** `preload.ts` allows `download:finished` and
  `download:error`, but main only ever emits `download:progress` — the other two never fire.
- **No license file.** Decide on and add a LICENSE before handing this to any outside
  developer or distributing builds. Note the separate ffmpeg redistribution obligations
  under "What is not in this archive".

## What is not in this archive

Deliberately excluded — fetch these separately rather than from the release asset:

- `resources/yt-dlp.exe`, `resources/ffmpeg.exe` — run `npm run prepare-resources`.
  ffmpeg redistribution carries LGPL/GPL source-offer obligations; don't re-bundle it.
- `third_party/RobustVideoMatting` — git submodule, see `.gitmodules`
  (`https://github.com/PeterL1n/RobustVideoMatting.git`).
- `third_party/ComfyUI-SeedVR2_VideoUpscaler`, `third_party/Open-Generative-AI` — vendored
  third-party projects; clone from their own upstreams.
- The yt-dlp fork tree (`yt_dlp/`, `test/`, `devscripts/`, `bundle/`) that this project's
  working copy sits inside. VideoPool consumes yt-dlp as a downloaded binary, not as source.
- Test media. The previous handoff bundle contained a commercial music video used as a
  download fixture; use `scripts/test_flow.ps1` with your own URL instead.
- `node_modules/` — run `npm install`.
