import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
    return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}

/**
 * Drop-in replacement for dexie-react-hooks useLiveQuery that works with React 19.
 *
 * Returns `undefined` while loading, then the query result.
 * Subscribes to Dexie's `liveQuery`, so the result re-renders whenever the
 * underlying tables change (e.g. after an edit, delete or settings update).
 * Re-subscribes whenever `deps` change; a result from previous deps is never returned.
 */
export function useLiveQuery<T>(
    querier: () => Promise<T> | T,
    deps: unknown[] = []
): T | undefined {
    const [state, setState] = useState<{ deps: unknown[]; value: T } | undefined>(undefined);

    useEffect(() => {
        const subscription = liveQuery(querier).subscribe({
            next: value => setState({ deps, value }),
            error: () => {
                // Query failed — leave as undefined
            },
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return state && sameDeps(state.deps, deps) ? state.value : undefined;
}
