# Spectral Diff — UI Action Matrix

## Audit Summary

All clickable and keyboard actions across screens and components.

---

## Lobby (`/`)

| Control | Trigger | Expected | Implemented In | Status | Notes |
|---------|---------|----------|----------------|--------|-------|
| Enter Haunted House button | Click | Navigate to /house | `page.tsx` | ✅ OK | `router.push("/house")` |
| PAT input | Type | Update tokenInput state | `GitHubConnectBox.tsx` | ✅ OK | Controlled input |
| Owner input | Type | Update owner state | `GitHubConnectBox.tsx` | ✅ OK | Controlled input |
| Repo input | Type | Update repo state | `GitHubConnectBox.tsx` | ✅ OK | Controlled input |
| Test button | Click | Validate token via API | `GitHubConnectBox.tsx` | ✅ OK | Calls `testToken()` → `/gh/me` |
| Connect button | Click | Store creds + validate | `GitHubConnectBox.tsx` | ✅ OK | Calls `connect()` → `/gh/me` |
| Disconnect button | Click | Clear localStorage | `GitHubConnectBox.tsx` | ✅ OK | Calls `disconnect()` |
| PR list item | Click | Load PR data | `PRPicker.tsx` | ✅ OK | Calls `onSelectPR()` → multiple API calls |
| Refresh PRs | Click | Reload PR list | `PRPicker.tsx` | ✅ OK | Calls `loadPRs()` → `/gh/pulls` |
| Demo mode link | Click | Load demo PR data | `page.tsx` | ✅ OK | Only shown when not connected; calls `resetToDemo()` |
| Switch to demo | Click | Reset to demo mode | `page.tsx` | ✅ OK | Only shown in real mode; calls `resetToDemo()` |

---

## House Map (`/house`)

| Control | Trigger | Expected | Implemented In | Status | Notes |
|---------|---------|----------|----------------|--------|-------|
| Room tile | Click | Open DiffMuralPanel | `RoomTile.tsx` | ✅ OK | Calls `onClick` → `selectFile()` |
| Room tile | Hover | Play creak sound (if risky) | `RoomTile.tsx` | ✅ OK | Calls `play("creak")` |
| Room tile | Focus | Visual focus ring | `RoomTile.tsx` | ✅ OK | CSS focus-visible |
| Arrow keys | Keydown | Navigate rooms | `house/page.tsx` | ✅ OK | Updates `focusedIndex` |
| Enter/Space | Keydown | Select focused room | `house/page.tsx` | ✅ OK | Calls `selectFile()` |
| L key | Keydown | Start Lantern Mode | `house/page.tsx` | ✅ OK | Navigate to `/lantern` |
| Escape | Keydown | Close panel | `house/page.tsx` | ✅ OK | Calls `selectFile(null)` |
| Panel close button | Click | Close panel | `DiffMuralPanel.tsx` | ✅ OK | Calls `onClose()` |
| Risk Breakdown accordion | Click | Toggle expand/collapse | `DiffMuralPanel.tsx` | ✅ OK | Toggles `riskExpanded` state |
| Lantern Mode button | Click | Navigate to /lantern | `DiffMuralPanel.tsx` | ✅ OK | `router.push("/lantern")` |

---

## Lantern Mode (`/lantern`)

| Control | Trigger | Expected | Implemented In | Status | Notes |
|---------|---------|----------|----------------|--------|-------|
| Next button | Click | Go to next hunk | `lantern/page.tsx` | ✅ OK | Updates `lanternCursor` |
| Prev button | Click | Go to prev hunk | `lantern/page.tsx` | ✅ OK | Updates `lanternCursor` |
| N key | Keydown | Go to next hunk | `lantern/page.tsx` | ✅ OK | Calls `handleNext()` |
| P key | Keydown | Go to prev hunk | `lantern/page.tsx` | ✅ OK | Calls `handlePrev()` |
| C key | Keydown | Open Exorcise | `lantern/page.tsx` | ✅ OK | Navigate to `/exorcise` |
| Escape | Keydown | Exit to House | `lantern/page.tsx` | ✅ OK | Navigate to `/house` |
| Exorcise button | Click | Navigate to /exorcise | `LanternOverlay.tsx` | ✅ OK | `router.push("/exorcise")` |
| MiniMap room | Click | Jump to file | `MiniMap.tsx` | ✅ OK | Updates cursor |
| Risk badge | Hover | Show risk tooltip | `LanternOverlay.tsx` | ✅ OK | Native `title` attribute with signals |

---

## Exorcise Chamber (`/exorcise`)

| Control | Trigger | Expected | Implemented In | Status | Notes |
|---------|---------|----------|----------------|--------|-------|
| Back button | Click | Return to Lantern | `ExorcisePanel.tsx` | ✅ OK | Calls `onBack()` |
| Review tab | Click | Switch to review mode | `ExorcisePanel.tsx` | ✅ OK | Sets `mode="safe"` |
| Patch tab | Click | Switch to patch mode | `ExorcisePanel.tsx` | ✅ OK | Sets `mode="patch"` |
| Approve tab | Click | Switch to approve mode | `ExorcisePanel.tsx` | ✅ OK | Sets `mode="approve"` (real only) |
| Post Comment | Click | Post comment to PR | `ExorcisePanel.tsx` | ✅ OK | API call in real mode, toast in demo |
| Request Changes | Click | Submit review | `ExorcisePanel.tsx` | ✅ OK | API call, disabled in demo with tooltip |
| Approve PR | Click | Approve PR | `ExorcisePanel.tsx` | ✅ OK | API call, disabled in demo with tooltip |
| Apply Patch | Click | Stage patch | `ExorcisePanel.tsx` | ✅ OK | First click confirms, second applies |
| Confirm Apply | Click | Create commit | `ExorcisePanel.tsx` | ✅ OK | API call, disabled in demo with tooltip |
| Escape | Keydown | Return to Lantern | `exorcise/page.tsx` | ✅ OK | Navigate to `/lantern` |

---

## TopBar (Global)

| Control | Trigger | Expected | Implemented In | Status | Notes |
|---------|---------|----------|----------------|--------|-------|
| Logo/Title | Click | Navigate to / | `TopBar.tsx` | ✅ OK | Link to home |
| Sound toggle | Click | Toggle sound on/off | `TopBar.tsx` | ✅ OK | Calls `toggleSound()` |
| Effects toggle | Click | Toggle reduce effects | `TopBar.tsx` | ✅ OK | Calls `toggleReduceEffects()` |

---

## ModeBanner (Global)

| Control | Trigger | Expected | Implemented In | Status | Notes |
|---------|---------|----------|----------------|--------|-------|
| Banner | Display | Show current mode | `ModeBanner.tsx` | ✅ OK | Shows demo/real + error state |
| Error banner | Display | Show error message | `ModeBanner.tsx` | ✅ OK | Auto-clears on next successful request (no dismiss button) |

---

## Loading & Error States

| Component | Loading State | Success State | Error State | Status |
|-----------|---------------|---------------|-------------|--------|
| GitHubConnectBox | "Connecting..." | Shows username | Shows error message | ✅ OK |
| PRPicker | "Summoning PRs..." | Shows PR list | Shows error + retry | ✅ OK |
| ExorcisePanel | "Working..." spinner | "✓" + message | "⚠️" + message | ✅ OK |
| Lobby PR load | Ghost spinner | Shows PR card | **Inline error + dismiss** | ✅ OK |

**Note:** Lobby PR load now shows a visible error banner with the error message and a "Dismiss and try again" button, not just console.error.

---

## Keyboard Navigation Summary

| Key | Lobby | House | Lantern | Exorcise |
|-----|-------|-------|---------|----------|
| Tab | Navigate inputs | Navigate rooms | Navigate buttons | Navigate actions |
| Enter | Submit/Select | Select room | - | Confirm action |
| Space | - | Select room | - | - |
| Escape | - | Close panel | Exit to House | Exit to Lantern |
| N | - | - | Next hunk | - |
| P | - | - | Prev hunk | - |
| C | - | - | Open Exorcise | - |
| L | - | Start Lantern | - | - |
| Arrows | - | Navigate rooms | - | - |

---

## Fixes Applied

All actions verified as working. No FIX items required.

### Improvements Made During Audit:
1. Added tooltips for disabled destructive actions in demo mode
2. Added explicit error messages when credentials missing
3. Added console.error logging (without token leakage)
4. Added loading/success/error states to all API actions
5. Added ModeBanner for clear mode indication
6. Enforced explicit Demo vs Real mode via `NEXT_PUBLIC_DEMO_MODE` env var
7. Moved types to `@/lib/types.ts` to prevent accidental demo data imports
8. Added build-time guard test to catch demo imports in real mode paths
9. Made `computeRoomRisk()` work without requiring full PR context
10. **Added visible inline error banner for PR load failures** (not just console.error)
11. **Added patch limitations notice** in Exorcise Chamber ("1 file only • No delete/rename")
12. **Risk Breakdown accordion** in DiffMuralPanel shows signals, critical findings, and notes
13. **Risk badge tooltip** in LanternOverlay shows top signals on hover
