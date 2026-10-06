import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

/**
 * Drop-in replacement for dexie-react-hooks useLiveQuery that works with React 19.
 *
 * Returns `undefined` while loading, then the query result.
 * Subscribes to Dexie's `liveQuery`, so the result re-renders whenever the
 * underlying tables change (e.g. after an edit, delete or settings update).
 * Re-subscribes whenever `deps` change.
 */
export function useLiveQuery<T>(
    querier: () => Promise<T> | T,
    deps: unknown[] = []
): T | undefined {
    const [result, setResult] = useState<T | undefined>(undefined);

    useEffect(() => {
        setResult(undefined);

        const subscription = liveQuery(querier).subscribe({
            next: value => setResult(() => value),
            error: () => {
                // Query failed — leave as undefined
            },
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return result;
}
