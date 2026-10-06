'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { SessionPlayerClient } from './SessionPlayerClient';

// Static export cannot pre-render arbitrary session ids, so the id travels as a
// query parameter (/session/play/?id=…) instead of a dynamic route segment.
function SessionPlayerFromQuery() {
    const sessionId = useSearchParams().get('id');

    if (!sessionId) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950">
                <p className="text-gray-400">Session not found.</p>
            </div>
        );
    }

    return <SessionPlayerClient key={sessionId} sessionId={sessionId} />;
}

export default function SessionPlayerPage() {
    return (
        <Suspense fallback={null}>
            <SessionPlayerFromQuery />
        </Suspense>
    );
}
