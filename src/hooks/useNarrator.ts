'use client';

import { useSyncExternalStore } from 'react';

import { narrator, type NarratorSnapshot } from '@lib/speech/narrator';

const SERVER_SNAPSHOT: NarratorSnapshot = { status: 'idle', index: -1, total: 0 };

/** Reactive view of the shared narrator (idle / playing / paused, and current item). */
export function useNarrator(): NarratorSnapshot {
    return useSyncExternalStore(narrator.subscribe, narrator.getSnapshot, () => SERVER_SNAPSHOT);
}
