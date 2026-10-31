/**
 * Lookup for recorded narration of the app's written content (technique pages, session
 * descriptions, onboarding and safety text). Keys match the `data-speech-clip`
 * attributes in the UI and are produced by `npm run generate:audio -- --content`.
 */

import manifest from '@/content/audio/content-manifest.json';

const CLIPS: Record<string, string> = manifest;

/** Path of the recorded clip for `key`, or undefined when none exists. */
export function contentClip(key: string): string | undefined {
    return CLIPS[key];
}
