# Devlog

> Project change journal. Newest first.

---

## 2026-05-08

### [23:50] Fix Windows build with GNU toolchain

**Type:** fix
**Files:**
- `src-tauri/src/lib.rs` — extended frameless/transparent window setup from Linux-only to all non-macOS; added setup hook for main window decorations
- `src-tauri/tauri.conf.json` — added `"transparent": true` to prevent white corner seams on Windows
- `src-tauri/capabilities/default.json` — added `allow-minimize`, `allow-toggle-maximize`, `allow-is-maximized` window permissions
- `src/components/WindowControls.tsx` — added minimize and maximize buttons with state-aware icon toggling

**Why:** First-time Windows build failed with multiple issues: MinGW gcc broken by PATH conflict with `/mingw64/bin` (SourceTree DLLs overriding real MinGW), ring crate's `gcc -E` failing, `create_dir` race in ring's build.rs, missing Tauri window permissions for minimize/maximize JS APIs, and white corner seams from non-transparent main window.

**What:**
- Diagnosed `gcc -E` failure as `/mingw64/bin` PATH entry containing non-MinGW DLLs (Avalonia, SourceTree) that broke cc1.exe dependency resolution; added `C:\ProgramData\mingw64\mingw64\bin` to PATH front
- Patched ring-0.17.14 `build.rs` line 373: `fs::create_dir` → `fs::create_dir_all` to handle preexisting pregenerated directory
- Extended `#[cfg(target_os = "linux")]` to `#[cfg(not(target_os = "macos"))]` for `decorations(false)` + `transparent(true)` on both main and settings windows
- Added `"transparent": true` to main window in tauri.conf.json — CSS `border-radius: 12px` on `#root` requires transparent window background to avoid white seams
- Added `core:window:allow-minimize`, `allow-toggle-maximize`, `allow-is-maximized` to capabilities — Tauri's `removeUnusedCommands` was stripping these JS APIs
- Built WindowControls component with minimize button, maximize/restore toggle button (tracks window state via `onResized` + `isMaximized`), and close button
- Switched Rust toolchain to `stable-x86_64-pc-windows-gnu` (MSVC Build Tools not installed)
- Set `RING_PREGENERATE_ASM=1` initially, but dropped it after PATH fix made native gcc compilation work

**Notes:** The signing key warning (`TAURI_SIGNING_PRIVATE_KEY`) is expected for local builds — only affects updater artifact signing. Windows 11's native rounded corners on frameless windows should work with `transparent: true` + `decorations: false`; on Windows 10 corners may be square.

### [00:30] Fix window control buttons non-functional on Windows

**Type:** fix
**Files:**
- `src-tauri/capabilities/default.json` — added `allow-minimize`, `allow-toggle-maximize`, `allow-is-maximized`
- `src-tauri/tauri.conf.json` — reverted `removeUnusedCommands: false` after linker export overflow (71616 exports > 65535 limit)

**Why:** Minimize and maximize buttons rendered but did nothing. Tauri's `removeUnusedCommands` dead-code elimination was stripping `minimize`, `toggleMaximize`, and `isMaximized` from the JS IPC bindings — only `close` survived because `allow-close` was already in capabilities. Disabling the optimization entirely caused `export ordinal too large` linker error.

**What:**
- Added `core:window:allow-minimize`, `core:window:allow-toggle-maximize`, `core:window:allow-is-maximized` to capabilities
- Kept `removeUnusedCommands: true` to stay under the 65535 DLL export limit
- Commands are no longer in the "Removed unused commands" list — confirmed in build output
