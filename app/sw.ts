import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, RangeRequestsPlugin, Serwist } from 'serwist';

declare global {
    interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const audioCacheEntry = {
    matcher: /\/audio\/.*\.(?:mp3|ogg|wav|m4a)$/i,
    handler: new CacheFirst({
        cacheName: 'audio-cache',
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
