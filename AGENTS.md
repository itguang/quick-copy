# AGENTS.md - Agent Guidelines

This file guides agentic coding assistants working in this repository.

## Overview

This is a **uTools plugin** (uTools 插件) that provides quick search, copy, and paste functionality. uTools plugins combine:
- **Node.js native capabilities** (file system, system APIs, etc.)
- **Web frontend** (HTML/CSS/JavaScript with frameworks like React)
- **uTools integration** (events, storage, clipboard, window management)

**References**: https://www.u-tools.cn/docs/developer/basic/getting-started.html

## Build Commands

```bash
npm install              # Install dependencies (uses npmmirror.com registry)
npm run dev             # Development watch build (webpack -w --mode development)
npm run build           # Production build (webpack --mode production)
```

**Important**: Only compile `dist/` folder when packaging plugin - do not include entire project root.

## Code Style Guidelines

### Imports
- **React**: Use named imports for hooks: `import React, { useEffect, useState, useRef, useCallback } from 'react'`
- **UI Libraries**: Named imports only: `import { Button, TextField } from '@mui/material'`
- **Components**: Default imports for component files: `import App from './App'`
- **Styles**: Import CSS files: `import './index.less'`
- **Services**: Preload exposes `window.services.*` - never call Node APIs or `window.utools.*` directly from React

### Formatting
- **Indentation**: 2 spaces
- **Lines**: ~120 columns (flexible)
- **No trailing whitespace**
- **Semicolons**: Required in preload (CommonJS), optional in React (Babel)

### Types
- **No TypeScript**: This codebase uses JavaScript with Babel
- **Type checking**: Manual type assertions via `typeof` and `Array.isArray()`
- **Validation**: Always validate inputs in preload functions (see `addString`, `importStrings`)

### Naming Conventions
- **Variables/Functions**: camelCase (`handleKeyDown`, `searchText`, `loadData`)
- **Components**: PascalCase (`App`, `ErrorBoundary`)
- **Constants**: CONSTANT_CASE (`STORAGE_KEY`, `GLOBAL_ERROR_ID`, `THEME_DIC`)
- **Functions**: Descriptive names: `getAllStrings`, `showSnackbar`, `ScrollToIndex`
- **State variables**: Clear prefixes: `searchText`, `selectedIndex`, `addDialogOpen`

### React Patterns
- **Components**: Functional components with hooks (React 19, automatic JSX runtime)
- **Hooks**: `useState`, `useEffect`, `useRef`, `useCallback` for state and lifecycle
- **Dependencies**: Always include all state variables in useEffect dependency arrays
- **Event handlers**: Define functions outside JSX or use useCallback for optimization
- **Refs**: `useRef` for DOM access and persistent values

### Error Handling
- **Preload (bridge/)**: Use try-catch with `console.error()`, return fallback values (empty arrays, false)
- **React**: Wrap in try-catch with user-friendly snackbar messages using `showSnackbar(message, 'error')`
- **Global**: ErrorBoundary catches React render errors and unhandled errors/promise rejections

## uTools Plugin Architecture

### Directory Structure
```
/{plugin}
|-- plugin.json          # Core configuration (required)
|-- preload.js           # Node.js/Electron API bridge
|-- index.html           # Main HTML entry
|-- index.js             # Compiled JS bundle
|-- index.css/.less      # Styles
|-- logo.png             # Plugin icon
|-- dist/                # Build output (package this folder)
```

### plugin.json Configuration
Required fields:
- `main`: Entry HTML file path (relative to plugin.json)
- `logo`: Plugin logo file path
- `preload`: Preload script file path (optional but recommended)
- `features`: Array of feature objects defining plugin capabilities

Feature object structure:
```json
{
  "code": "feature_id",
  "explain": "Feature description",
  "cmds": ["feature-command"]  // Can be strings (feature cmd) or objects (match cmd)
}
```

**Command types**:
- **Feature command** (`"search"`): Searchable keywords to open plugin
- **Match command**: Match external input types:
  - `regex`: Match text patterns (URLs, phone numbers, etc.)
  - `over`: Match any text with optional exclude filters
  - `img`: Match images (screenshot, clipboard images)
  - `files`: Match files/folders with extension filters
  - `window`: Match active system windows

### Preload Script (bridge/preload.js)
**Purpose**: Bridge between Node.js/Electron APIs and React frontend

**Requirements**:
- Must use **CommonJS** module system (`require`/`module.exports`)
- Can import Node.js native modules (`fs`, `path`, `child_process`, etc.)
- Can import Electron renderer process APIs (`clipboard`, `nativeImage`, etc.)
- Can import third-party Node.js packages (npm or source)
- **Must NOT** be minified/obfuscated - code must be readable
- Expose controlled functions via `window.services.*` only

**Security constraints**:
- Never expose raw Node.js modules (fs, require, etc.) directly to React
- Only expose function interfaces, not entire modules
- Return false/error messages, not raw errors

## uTools API Reference

### Events
**`utools.onPluginEnter(callback)`**: Triggered when user enters plugin
- `callback({ code, type, payload, from, option })`
- `code`: feature.code from plugin.json
- `type`: command type (text, img, file, regex, over, window)
- `payload`: matched data based on type
- `from`: entry source (main, panel, hotkey, redirect)
- `option`: custom data for mainPush features

**`utools.onPluginOut(callback)`**: Triggered when plugin exits
- `callback(isKill)` - `true` if process killed, `false` if hidden to background

### Window Management
**`utools.hideMainWindow([isRestorePreWindow])`**: Hide uTools main window
- `isRestorePreWindow`: restore focus to previous window (default: true)

**`utools.showMainWindow()`**: Show uTools main window

**`utools.setExpendHeight(height)`**: Set plugin window height (in pixels)

**`utools.outPlugin([isKill])`**: Exit plugin (default: hide to background)
- `isKill: true` to kill process

**`utools.setSubInput(onChange, placeholder, isFocus)`**: Set sub-input field
- `onChange({ text })`: callback when input changes
- `placeholder`: input placeholder text
- `isFocus`: auto-focus input (default: true)

**`utools.setSubInputValue(text)`**: Set sub-input value programmatically

**`utools.removeSubInput()`**: Remove sub-input field

### Copy & Paste
**`utools.copyText(text)`**: Copy text to clipboard

**`utools.copyFile(filePath)`**: Copy file(s) to clipboard

**`utools.copyImage(image)`**: Copy image to clipboard
- `image`: file path, base64 data URL, or Buffer

**`utools.getCopyedFiles()`**: Get copied files from clipboard
- Returns array of `{ path, isFile, isDirectory, name }`

**`utools.hideMainWindowPasteText(text)`**: Copy text and paste immediately

**`utools.simulateKeyboardTap(key, ...modifiers)`**: Simulate keyboard shortcut
- `key`: character key (e.g., 'v', 'enter')
- `modifiers`: 'ctrl', 'alt', 'shift', 'meta' (Command on macOS)
- Example: `simulateKeyboardTap('v', 'ctrl')` (Windows/Linux paste)
- Example: `simulateKeyboardTap('v', 'command')` (macOS paste)

### Storage
**`utools.dbStorage.setItem(key, value)`**: Store key-value pair
**`utools.dbStorage.getItem(key)`**: Retrieve value by key
**`utools.dbStorage.removeItem(key)`**: Remove key-value pair

**Database (NoSQL)**:
- `utools.db.put(doc)`: Create/update document (max 1M)
- `utools.db.get(id)`: Get document by ID
- `utools.db.remove(doc)`: Remove document
- `utools.db.allDocs([prefix])`: Get all docs or filter by prefix
- Support for attachments and cloud sync

### System APIs
**`utools.showNotification(body, clickFeatureCode)`**: Show system notification

**`utools.shellOpenPath(path)`**: Open file/folder with default app

**`utools.shellShowItemInFolder(path)`**: Show file in file explorer

**`utools.shellOpenExternal(url)`**: Open URL in default browser

**Platform detection**:
- `utools.isMacOS()`: Check if macOS
- `utools.isWindows()`: Check if Windows
- `utools.isLinux()`: Check if Linux
- `utools.isDev()`: Check if in development mode

**`utools.getPath(name)`**: Get system paths
- `home`, `appData`, `userData`, `temp`
- `desktop`, `documents`, `downloads`, `music`, `pictures`, `videos`, `logs`

## Component Organization
- **bridge/preload.js**: Service layer - only function exports via `window.services`
- **src/App.js**: Main React component with all UI logic and event handlers
- **src/ErrorBoundary.js**: Global error handling wrapper
- **src/index.js**: React entry point
- **src/index.less**: Global styles
- **public/**: Static assets copied to dist/ by webpack

## State Management
- **Local state**: useState for component state, minimize unnecessary re-renders
- **Refs**: useRef for DOM elements and persistent values across renders
- **Search**: Always update both `searchText` state and `window.utools.setSubInputValue()`

## Material UI (MUI) Guidelines
- **v7**: Using @mui/material v7 with Emotion styling
- **Components**: Use the sx prop for inline styles, create custom themes in `THEME_DIC`
- **Theme**: Support both light and dark modes based on `prefers-color-scheme`
- **Icons**: Import from `@mui/icons-material`

### uTools Integration Best Practices
- **Entry point**: Always handle `onPluginEnter({ code, type, payload, from })` in useEffect
- **Main window**: Call `window.utools.hideMainWindow()` on plugin enter (except when needed)
- **Sub-input**: Use `window.utools.setSubInput(onChange, placeholder)` - pass payload to search
- **Copy**: Always use `window.utools.copyText(text)` - never use browser clipboard API
- **Paste**: Use platform-specific shortcuts (Command+V on macOS, Ctrl+V on Windows/Linux)
- **Exit**: Use `window.utools.outPlugin()` to close plugin
- **Storage**: Use `window.utools.dbStorage` for simple key-value storage
- **System detection**: Use `utools.isMacOS()`, `utools.isWindows()` for platform-specific logic

## Architecture Notes
- **Preload bridge Pattern**: Node.js/Electron APIs only in `bridge/preload.js`, expose via `window.services.*`
- **No Node access from React**: Never call fs, require, or other Node APIs from React components
- **Security**: Return false/error messages, not raw errors, from service functions
- **Comments**: Use block comments in preload (Chinese), minimal inline comments in React
- **Code clarity**: Preload must not be minified - all code must remain readable

## Testing
Currently no test framework is configured. To add tests:
1. Choose a framework (Jest, Vitest, etc.)
2. Create test files alongside source files (e.g., `App.test.js`)
3. Add test scripts to package.json
4. Configure the test runner with appropriate transforms for JSX and ES6+

### Running a Single Test (once configured)
```bash
npm test -- App.test.js        # Run specific test file
npm test -- --grep "copy"      # Run tests matching pattern (Jest)
npm test -- run App.test.js   # Run single test file (Vitest)
```
