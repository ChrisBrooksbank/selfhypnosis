# Audio Playback

## Overview

TTS-generated audio for guided sessions with an audio player, audio manager, offline caching, and range request support. Audio drives segment timing when available; text-only fallback otherwise.

## References

- `plan.md` → Phase 2 (TTS audio, AudioPlayer, audioManager), Phase 3 (per-technique audio guides), Tech Stack (Serwist + workbox-range-requests)
- `research.md` → Tips for Beginners #5 ("Use recordings initially")

## User Stories

- As a user, I can listen to guided audio during sessions so I don't have to read text.
- As a user, audio plays reliably offline after being cached.
- As a user, I can pause, resume, and seek within audio playback.
- As a user, audio segments sync with the session phase timer.

## Requirements

### Audio Manager

- `src/lib/session/audioManager.ts`
- Manages audio playback queue for a session.
- Preloads next phase's audio while current phase plays.
- Methods: `loadSession(sessionId)`, `playSegment(phaseId, segmentIndex)`, `pause()`, `resume()`, `seek(seconds)`, `stop()`.
- Uses Web Audio API or HTML5 Audio element.
- Emits events: `onSegmentEnd`, `onPhaseEnd`, `onError`.
- Fallback: if audio fails to load, session continues in text-only mode.

### Audio Player Component

- `src/components/session/AudioPlayer.tsx`
- Play/pause button.
- Progress bar with seek.
- Current time / total time display.
- Volume control (optional).
- Integrated into session page — not a standalone music player.

### Audio Files

- `src/content/audio/` — pre-generated TTS audio files (MP3 format).
- `src/content/audio/manifest.json` — maps sessionId + phaseId + segmentIndex to audio file paths.
- Audio files generated externally (ElevenLabs or similar) and placed in this directory.
- Phase 2: audio for 3 MVP sessions.
- Phase 3: audio for 2 additional sessions + per-technique "Try It" guides.

### Offline Caching

- Serwist service worker configuration for audio files.
- `workbox-range-requests` plugin for Safari compatibility (Safari requires range request support for audio).
- Cache-first strategy for audio files.
- Cache storage limit awareness (warn user if storage is low).

### Session Engine Integration

- When audio is available, segment timing is driven by audio duration (not configured seconds).
- `audioManager` emits `onSegmentEnd` which triggers the engine to advance.
- When audio is unavailable, engine falls back to configured `durationSeconds` per segment.

## Acceptance Criteria

- [ ] Audio manager loads and plays audio segments in sequence.
- [ ] Pause/resume works without losing position.
- [ ] Audio playback continues across phase transitions.
- [ ] Offline: cached audio plays without network.
- [ ] Safari: range requests work for seeking.
- [ ] Text-only fallback works when audio is unavailable.
- [ ] Audio player UI shows progress, time, and controls.
- [ ] `npm run check` passes.

## Out of Scope

- Audio generation (done externally).
- Recording user's own audio.
- Background audio playback when app is minimized (platform-dependent).
- Web Speech API for reading custom suggestions (Phase 4).
