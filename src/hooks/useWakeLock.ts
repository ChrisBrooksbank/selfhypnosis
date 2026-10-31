'use client';

import { useEffect } from 'react';

import { Logger } from '@utils/logger';

/**
 * Keep the screen awake while `active` is true, so a long eyes-closed session is
 * not interrupted by the device sleeping. Re-acquires the lock when the tab becomes
 * visible again (browsers release it on hide). Silently does nothing if unsupported.
 */
export function useWakeLock(active: boolean): void {
    useEffect(() => {
        if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

        let sentinel: WakeLockSentinel | null = null;
        let cancelled = false;

        const acquire = async () => {
            try {
                const lock = await navigator.wakeLock.request('screen');
                if (cancelled) {
                    await lock.release();
                    return;
                }
                sentinel = lock;
            } catch (err) {
                Logger.debug('Wake lock unavailable:', String(err));
            }
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') void acquire();
        };

        void acquire();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisibility);
            sentinel?.release().catch(() => undefined);
        };
    }, [active]);
}
