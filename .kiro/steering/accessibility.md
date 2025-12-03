# Accessibility

## Keyboard Navigation
Must support full keyboard navigation for:

### House Map (/house)
- Arrow keys: Navigate between room tiles
- Enter/Space: Select room, open Diff Mural Panel
- Escape: Close panel
- L: Start Lantern Run from darkest room

### Lantern Mode (/lantern)
- N: Next hunk
- P: Previous hunk
- C: Jump to Exorcise Chamber
- Escape: Exit to House

### Exorcise Chamber (/exorcise)
- Tab: Navigate between actions
- Enter: Confirm action
- Escape: Back to Lantern

## Reduce Motion
- Global toggle in TopBar (🌙/✨)
- Respects `prefers-reduced-motion: reduce` media query
- When enabled:
  - Disables fog drift animation
  - Disables scratch shimmer
  - Disables pulse glow
  - Disables lantern flicker
  - Auto-disables sound effects

## Contrast
- Dark mode only (bg: #0a0a0f)
- Text contrast ratios:
  - Primary text: #e5e5e5 on #0a0a0f (13.5:1) ✓
  - Muted text: #9ca3af on #0a0a0f (7.2:1) ✓
  - Critical: #fca5a5 on #450a0a (8.1:1) ✓

## Focus Indicators
- All interactive elements have visible focus ring
- Purple glow: `outline: 2px solid rgba(139, 92, 246, 0.8)`
- Offset: 2px

## Screen Reader
- Room tiles have descriptive aria-labels including risk score, band, LOC, and signal count
- Dialogs properly labeled with aria-label
- Progress indicators announce current position

## Implementation
- Preferences stored in localStorage
- Sync with system preferences on load
- Toggle state visible in TopBar
