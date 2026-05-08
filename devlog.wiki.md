# Devlog

> Project change journal. Newest first.

---

## 2026-05-09

### [01:20] Enable multi-platform release CI and fix authorship

**Type:** ci
**Files:**
- `.github/workflows/release.yml` — added macOS (ARM64 + x86_64) and Windows to build matrix
- `README.md` — added Downloads section, Windows platform badge, build notes
- `devlog.wiki.md` — created change journal

**Why:** Release workflow only built Linux on ubuntu-22.04. Needed Windows .exe/.msi/.nsis, macOS .dmg/.app.tar.gz, and Linux .deb/.AppImage/.rpm packages for full cross-platform distribution. Previous commits were authored under wrong identity.

**What:**
- Added `macos-latest` (aarch64 + x86_64 targets) and `windows-latest` to CI matrix
- Pushed tag v0.5.9 to trigger workflow; dispatched manually since force-push didn't trigger
- Amended previous commits to vyroxat <vyroxat@gmail.com>
- Deleted manual v0.5.9-windows release (will be superseded by CI-generated release)
- Release will be created as draft by tauri-action; .sig files require TAURI_SIGNING_PRIVATE_KEY secret

**Notes:** Manual Windows build artifacts at src-tauri/target/release/ were uploaded as standalone v0.5.9-windows release then deleted. CI-generated release will have all platforms. User needs to add TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD to repo secrets for signed packages.

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
