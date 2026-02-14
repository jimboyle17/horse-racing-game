# Sound System (SoundManager ~line 232)

All audio is synthesised using the Web Audio API. No external audio files.

AudioContext is lazily initialised on first user click.

## Sound Effects

| Method | Trigger | Implementation |
|--------|---------|---------------|
| `playClick()` | Any interactive element click | Sine 880Hz, gain 0.08, 80ms |
| `playFanfare()` | Player wins a race | 4 triangle-wave notes (C5 E5 G5 C6), gain 0.15, staggered 200ms |
| `playGavel()` | Auction lot sold | White noise buffer 150ms, lowpass 2kHz, gain 0.2 |
| `playWhoosh()` | Decision moment appears | Sawtooth sweep 200->1200->100Hz, gain 0.06, 400ms |
| `startCrowd()` | Race begins | Looping white noise 2s buffer, bandpass 800Hz Q=0.5, gain 0.03. Returns stop function. |
| `buildCrowd()` | Tick 75 (final stretch) | Ramps crowd gain to 0.08, filter to 1600Hz over 1s |
| `startHoofbeats(bpm)` | Race begins | Sine pulses 80Hz, gain 0.06, 50ms each, default 300 BPM. Returns stop function. |
| `toggleMute()` | Mute button | Sets `this.muted` flag, updates all `.btn-mute` elements |
