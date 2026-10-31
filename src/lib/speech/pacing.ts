/**
 * Silent time to leave after a spoken technique step, taken from the step's own
 * duration text ("30 seconds", "1–2 minutes"). Uses the lower end of a range, never
 * less than 8 seconds or more than 2 minutes, and 15 seconds when there is no duration.
 */

const MIN_GAP_MS = 8_000;
const MAX_GAP_MS = 120_000;
const DEFAULT_GAP_MS = 15_000;

export function stepGapMs(duration: string | undefined): number {
    if (!duration) return DEFAULT_GAP_MS;
    const match = duration.match(/(\d+)(?:\s*[–-]\s*\d+)?\s*(seconds?|secs?|minutes?|mins?)/i);
    if (!match) return DEFAULT_GAP_MS;
    const amount = Number(match[1]);
    const unit = match[2]!.toLowerCase();
    const ms = amount * (unit.startsWith('min') ? 60_000 : 1_000);
    return Math.min(MAX_GAP_MS, Math.max(MIN_GAP_MS, ms));
}
