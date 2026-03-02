import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drop-in replacement for dexie-react-hooks useLiveQuery that works with React 19.
 *
 * Returns `undefined` while loading, then the query result.
 * Re-runs whenever `deps` change. Does NOT live-subscribe to Dexie changes
 * (use a manual refresh if needed).
 */
export function useLiveQuery<T>(
    querier: () => Promise<T> | T,
    deps: unknown[] = [],
    defaultResult?: T
): T | undefined {
    const [result, setResult] = useState<T | undefined>(defaultResult);
    const mountedRef = useRef(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableQuerier = useCallback(querier, deps);

    useEffect(() => {
        mountedRef.current = true;
        setResult(defaultResult);

        let cancelled = false;

        async function run() {
            try {
                const value = await stableQuerier();
                if (!cancelled && mountedRef.current) {
                    setResult(value);
                }
            } catch {
                // Query failed — leave as default
            }
        }

        run();

        return () => {
            cancelled = true;
            mountedRef.current = false;
        };
    }, [stableQuerier, defaultResult]);

    return result;
}
