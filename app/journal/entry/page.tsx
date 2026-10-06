'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { JournalEntryView } from '@components/journal/JournalEntryView';

// Static export cannot pre-render arbitrary entry ids, so the id travels as a
// query parameter (/journal/entry/?id=…) instead of a dynamic route segment.
function JournalEntryFromQuery() {
    const entryId = useSearchParams().get('id') ?? '';
    return <JournalEntryView key={entryId} entryId={entryId} />;
}

export default function JournalEntryPage() {
    return (
        <Suspense fallback={null}>
            <JournalEntryFromQuery />
        </Suspense>
    );
}
