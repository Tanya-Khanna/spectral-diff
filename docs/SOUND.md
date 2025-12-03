# Spectral Diff — Sound System

## Overview

Spectral Diff uses subtle audio cues to enhance the haunted house experience. The sound system is designed to be:
- **Non-blocking**: Never crashes if audio fails
- **Accessible**: Respects user preferences and reduced motion settings
- **Lightweight**: Uses WebAudio synthesis only (no external audio files)
- **Throttled**: Prevents sound spam on rapid interactions (e.g., hover)

---

## Sound Types

| Sound | Trigger | Description |
|-------|---------|-------------|
| `creak` | Hovering risky rooms (dark/cursed band) | Low rumble, 80Hz sawtooth |
| `match` | Entering Lantern Mode | Quick strike, 2kHz sine |
| `whoosh` | Navigating between hunks | Soft sweep, 400Hz sine |
| `seal` | Successful action (comment, approve, patch) | Satisfying chime, 600Hz triangle |

---

## Architecture

### WebAudio-Only Design

The sound system uses the Web Audio API exclusively for synthesis. This approach:
- **Zero external assets**: No MP3 files to load or fail
- **Instant playback**: No network latency
- **Tiny footprint**: Just oscillator code
- **Browser-native**: Works in all modern browsers

### Sound Parameters

```typescript
const SOUND_PARAMS = {
  creak: { freq: 80, duration: 0.15, type: "sawtooth", throttleMs: 400 },
  match: { freq: 2000, duration: 0.05, type: "sine", throttleMs: 100 },
  whoosh: { freq: 400, duration: 0.1, type: "sine", throttleMs: 150 },
  seal: { freq: 600, duration: 0.2, type: "triangle", throttleMs: 200 },
};
```

Each sound uses:
- An oscillator with the specified frequency and waveform
- A gain node with quick exponential fade-out
- Volume capped at 0.15 (15%) for subtlety
- **Throttle** to prevent spam on rapid triggers

---

## User Controls

### Sound Toggle (TopBar)

- **🔊 On**: Plays sounds on interactions
- **🔇 Off**: All sounds disabled

### Reduce Effects Toggle (TopBar)

When enabled:
- Disables all sounds (same as sound off)
- Also disables visual animations

### System Preference

Automatically respects `prefers-reduced-motion: reduce`:
- Sets `reduceEffects` to true on load
- Disables all sounds by default

---

### Throttling

To prevent glitchy sound spam (especially on hover), each sound type has a throttle:

| Sound | Throttle | Reason |
|-------|----------|--------|
| `creak` | 400ms | Hover sounds can fire rapidly |
| `match` | 100ms | Quick action, minimal throttle |
| `whoosh` | 150ms | Navigation sounds |
| `seal` | 200ms | Success sounds |

If `play("creak")` is called twice within 400ms, the second call is ignored.

---

## Accessibility Notes

### WCAG 2.1 Compliance

- **1.4.2 Audio Control**: Sound is off by default, user must enable
- **2.3.1 Three Flashes**: No flashing audio triggers
- **Reduced Motion**: Respects `prefers-reduced-motion`

### Screen Reader Compatibility

- Sounds are purely decorative (not informational)
- All actions have visual feedback independent of sound
- No audio-only notifications

### Autoplay Policy

Modern browsers block autoplay. The system handles this by:
1. Attempting to play audio file
2. Catching autoplay rejection
3. Falling back to WebAudio (often allowed for short sounds)
4. Silently failing if all audio blocked

---

## Implementation Details

### SoundProvider Component

Located at `apps/web/src/components/SoundProvider.tsx`

```typescript
// Usage in components
const { play } = useSound();
play("creak"); // Plays creak sound (file or WebAudio)
```

### Error Handling

All audio operations are wrapped in try-catch:
- File load errors → WebAudio fallback
- WebAudio errors → Silent (no crash)
- Autoplay blocked → WebAudio fallback

### Caching

- Audio elements are cached in a Map
- File availability is tracked to avoid repeated failures
- AudioContext is created once and reused

---

## Troubleshooting

### No Sound Playing

1. Check sound toggle in TopBar (should be 🔊)
2. Check reduce effects toggle (should be off)
3. Check browser console for audio errors
4. Try clicking somewhere first (autoplay policy)

### Sound Too Loud/Quiet

- File volume: Adjust in audio editor
- WebAudio volume: Modify `gainNode.gain.setValueAtTime(0.15, ...)` in SoundProvider

### Sound Plays Multiple Times

- Audio elements are reused with `currentTime = 0`
- If overlapping, consider adding a debounce

---

## Future Enhancements

Potential improvements (not currently implemented):

- [ ] Spatial audio (pan based on room position)
- [ ] Dynamic volume based on risk level
- [ ] Additional sounds for error states
- [ ] Sound themes (classic, minimal, spooky)
