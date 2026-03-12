# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install dependencies: `npm install`
- Development watch build: `npm run dev`
  - Runs webpack in development watch mode and rebuilds into `dist/` on file changes.
- Production build: `npm run build`
  - Builds both preload and renderer bundles into `dist/`.

### Lint / test status

- There is currently no lint script in `package.json`.
- There is currently no test framework or test script configured.
- Running a single test is not applicable until a test runner is added.

## High-level architecture

This repository is a **uTools plugin** with a React renderer and an Electron preload bridge.

### Runtime flow

1. `public/plugin.json` defines plugin features/commands (`over`, `main`) and points to:
   - `index.html` as UI entry
   - `preload.js` as preload entry (built artifact)
2. Webpack builds two targets:
   - **Preload bundle** (`bridge/preload.js` → `dist/preload.js`) for uTools/Electron-side APIs.
   - **Renderer bundle** (`src/index.js` → `dist/index.js`) for React UI.
   - Static assets from `public/` are copied into `dist/`.
3. Renderer calls `window.services.*` (exposed by preload) for data operations.
4. On copy action, renderer uses `window.utools` APIs to copy text, hide plugin window, exit plugin, and simulate paste.

### Data and service layer

- `bridge/preload.js` is the service boundary.
- Persistent storage uses `window.utools.dbStorage` with key `string_list`.
- Exposed APIs on `window.services` include:
  - CRUD/search: `getAllStrings`, `addString`, `addStrings`, `removeString`, `searchStrings`
  - import/export: `exportStrings`, `importStrings`, `importFromFile`
- Data model is a string array with deduplication on add/import.

### UI layer

- `src/index.js` mounts React app wrapped by `ErrorBoundary`.
- `src/App.js` contains the main UI (MUI components), keyboard navigation, search/add/delete/import/export, and plugin lifecycle handling (`onPluginEnter`).
- `src/ErrorBoundary.js` handles:
  - React render errors
  - global runtime errors (`error` and `unhandledrejection`) with in-app display and copy support.
- `src/index.less` contains base layout and global error styles.

## Key files

- `webpack.config.js` — dual-target webpack build (preload + renderer)
- `public/plugin.json` — uTools plugin manifest/features
- `bridge/preload.js` — preload service bridge and storage logic
- `src/App.js` — main application behavior and interactions
- `src/ErrorBoundary.js` — error capture and display

## uTools documentation dependency (important)

This project is developed against the official uTools developer docs. Future changes should prioritize official API behavior and lifecycle constraints.

### Primary doc entry

- Quick start: https://www.u-tools.cn/docs/developer/basic/getting-started.html

### Basic development workflow docs

- First plugin: https://www.u-tools.cn/docs/developer/basic/first-plugin.html
- Debug plugin: https://www.u-tools.cn/docs/developer/basic/debug-plugin.html
- Offline package: https://www.u-tools.cn/docs/developer/basic/offline-plugin.html
- Publish plugin: https://www.u-tools.cn/docs/developer/basic/publish-plugin.html

### uTools API index used as canonical reference

- Events: https://www.u-tools.cn/docs/developer/utools-api/events.html
- Window: https://www.u-tools.cn/docs/developer/utools-api/window.html
- Copy: https://www.u-tools.cn/docs/developer/utools-api/copy.html
- Input: https://www.u-tools.cn/docs/developer/utools-api/input.html
- System: https://www.u-tools.cn/docs/developer/utools-api/system.html
- Screen: https://www.u-tools.cn/docs/developer/utools-api/screen.html
- User: https://www.u-tools.cn/docs/developer/utools-api/user.html
- Data storage: https://www.u-tools.cn/docs/developer/utools-api/db.html
- Dynamic features: https://www.u-tools.cn/docs/developer/utools-api/features.html
- Simulate: https://www.u-tools.cn/docs/developer/utools-api/simulate.html
- Payment: https://www.u-tools.cn/docs/developer/utools-api/payment.html
- uBrowser: https://www.u-tools.cn/docs/developer/utools-api/ubrowser.html
- AI: https://www.u-tools.cn/docs/developer/utools-api/ai.html
- Sharp: https://www.u-tools.cn/docs/developer/utools-api/sharp.html
- FFmpeg: https://www.u-tools.cn/docs/developer/utools-api/ffmpeg.html
- Server API: https://www.u-tools.cn/docs/developer/server-api.html

### API checklist (all API families from quick-start navigation)

#### Events

- `onPluginEnter`, `onPluginOut`, `onMainPush`, `onPluginDetach`, `onDbPull`

#### Window and plugin lifecycle

- `hideMainWindow`, `showMainWindow`, `setExpendHeight`, `outPlugin`, `redirect`
- Sub-input: `setSubInput`, `removeSubInput`, `setSubInputValue`, `subInputFocus`, `subInputBlur`, `subInputSelect`
- Dialog/find/drag/window comms: `showOpenDialog`, `showSaveDialog`, `findInPage`, `stopFindInPage`, `startDrag`, `createBrowserWindow`, `sendToParent`, `getWindowType`, `isDarkColors`

#### Copy / paste / input

- Copy APIs: `copyText`, `copyFile`, `copyImage`, `getCopyedFiles`
- One-step hide+paste/type APIs: `hideMainWindowPasteFile`, `hideMainWindowPasteImage`, `hideMainWindowPasteText`, `hideMainWindowTypeString`

#### System

- Notification/shell: `showNotification`, `shellOpenPath`, `shellTrashItem`, `shellShowItemInFolder`, `shellOpenExternal`, `shellBeep`
- App/system info: `getNativeId`, `getAppName`, `getAppVersion`, `getPath`, `getFileIcon`, `readCurrentFolderPath`, `readCurrentBrowserUrl`
- Platform checks: `isDev`, `isMacOS`, `isWindows`, `isLinux`

#### Screen

- Capture/pick: `screenColorPick`, `screenCapture`, `desktopCaptureSources`
- Display queries: `getPrimaryDisplay`, `getAllDisplays`, `getCursorScreenPoint`, `getDisplayNearestPoint`, `getDisplayMatching`
- Coordinate conversion: `screenToDipPoint`, `dipToScreenPoint`, `screenToDipRect`, `dipToScreenRect`

#### User

- `getUser`, `fetchUserServerTemporaryToken`

#### Data storage

- Document DB: `db.put/get/remove/bulkDocs/allDocs/postAttachment/getAttachment/getAttachmentType/replicateStateFromCloud` (+ `db.promises.*` forms)
- KV storage: `dbStorage.setItem/getItem/removeItem`
- Encrypted KV: `dbCryptoStorage.setItem/getItem/removeItem`

#### Dynamic features

- `getFeatures`, `setFeature`, `removeFeature`, `redirectHotKeySetting`, `redirectAiModelsSetting`

#### Simulate input

- `simulateKeyboardTap`, `simulateMouseMove`, `simulateMouseClick`, `simulateMouseDoubleClick`, `simulateMouseRightClick`

#### Payment

- Client-side: `isPurchasedUser`, `openPurchase`, `openPayment`, `fetchUserPayments`
- Server-side: use temporary token + server endpoints in `server-api.html` (e.g. base info, order query, goods creation, callback handling)

#### uBrowser

- Core chain + execution: `goto`, `run`, `when`, `end`, `wait`
- Interaction: `evaluate`, `press`, `click`, `mousedown`, `mouseup`, `dblclick`, `hover`, `input`, `value`, `check`, `focus`, `scroll`, `paste`, `file`, `drop`
- Output/tools: `screenshot`, `markdown`, `pdf`, `download`, `devTools`
- Browser/session config: `useragent`, `viewport`, `device`, `css`, `show`, `hide`, `cookies`, `setCookies`, `removeCookies`, `clearCookies`
- Global helpers: `getIdleUBrowsers`, `setUBrowserProxy`, `clearUBrowserCache`

#### AI

- `utools.ai(...)` (supports stream callback/function calling), `allAiModels`, and request `abort()` handle

#### Sharp

- Image pipeline via `utools.sharp()` and common operations such as `resize`, `rotate`, `flip`, `flop`, `grayscale`, `negate`, `blur`, `sharpen`, `threshold`, `normalize`, `gamma`, `median`, `tint`, `flatten`, `extend`, `trim`, `extract`, `composite`, format output (`jpeg/png/webp/tiff`), `toBuffer`, `toFile`, `metadata`, `clone`

#### FFmpeg

- `runFFmpeg(args, onProgress)` with task control via `kill()` / `quit()`

### Constraints from docs that matter for this repo

- Plugin shape is web UI + Node/Electron preload capabilities.
- Keep Node/native access in `preload` side and expose controlled functions to renderer (`window.services` pattern already used here).
- `preload.js` changes are typically not hot-reloaded in dev; ensure full reload/restart behavior when debugging preload logic.
- `plugin.json` is the source of truth for feature routing and lifecycle entry; code changes should stay aligned with configured `features`/`cmds`.
