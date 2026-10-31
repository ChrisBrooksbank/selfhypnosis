import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, RangeRequestsPlugin, Serwist } from 'serwist';

declare global {
    interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Narration clips are cache-first, and regenerated clips keep the same filenames, so the
 * cache name is the version. Bump the number whenever the audio files change, otherwise
 * returning visitors keep playing the old recordings.
 */
const AUDIO_CACHE = 'audio-cache-v2';

const audioCacheEntry = {
    matcher: /\/audio\/.*\.(?:mp3|ogg|wav|m4a)$/i,
    handler: new CacheFirst({
        cacheName: AUDIO_CACHE,
        plugins: [new RangeRequestsPlugin()],
    }),
    method: 'GET' as const,
};

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [audioCacheEntry, ...defaultCache],
});

serwist.addEventListeners();

// Drop audio caches from earlier versions so stale clips are never served.
interface ActivateEvent extends Event {
    waitUntil(promise: Promise<unknown>): void;
}

(self as unknown as EventTarget).addEventListener('activate', e => {
    (e as ActivateEvent).waitUntil(
        caches
            .keys()
            .then(names =>
                Promise.all(
                    names
                        .filter(name => name.startsWith('audio-cache') && name !== AUDIO_CACHE)
                        .map(name => caches.delete(name))
                )
            )
    );
});
