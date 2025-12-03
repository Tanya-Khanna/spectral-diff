# Screenshots

This directory contains screenshots used in documentation and demos.

## Files

- `lobby-connected.png` - Lobby screen with GitHub connected
- `haunted-house.png` - House view showing file rooms with risk indicators
- `exorcise-chamber.png` - Exorcise panel with patch preview

## Usage

These screenshots are referenced in:
- Main README.md
- docs/DEMO_GUIDE.md
- Presentation materials

## Capture Commands

```bash
# Use Playwright to capture screenshots
pnpm --filter @spectral/web exec playwright test --headed

# Or manual capture with browser dev tools
# 1. Open app in browser
# 2. Navigate to desired screen
# 3. Use browser screenshot tool or cmd+shift+4 (Mac)
```
