/**
 * Soft three-note chime synthesised with the Web Audio API (no audio file needed,
 * so it works offline). Used to signal gently that a session has finished.
 */

import { Logger } from '@utils/logger';

const NOTES_HZ = [523.25, 659.25, 783.99]; // C5, E5, G5
const NOTE_GAP_S = 0.9;
const NOTE_LENGTH_S = 4;

export function playChime(): void {
    try {
        const Ctx =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const start = ctx.currentTime + 0.05;

        NOTES_HZ.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = start + i * NOTE_GAP_S;
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + NOTE_LENGTH_S);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + NOTE_LENGTH_S);
        });

        const totalMs = (NOTES_HZ.length * NOTE_GAP_S + NOTE_LENGTH_S + 0.5) * 1000;
        window.setTimeout(() => void ctx.close(), totalMs);
    } catch (err) {
        Logger.debug('Chime unavailable:', String(err));
    }
}
