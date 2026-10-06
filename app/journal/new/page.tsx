'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { PageHeader } from '@components/layout/PageHeader';
import { JournalEditor } from '@components/journal/JournalEditor';

// Reads ?sessionId= so entries opened from a session summary are linked to it.
function JournalEditorFromQuery() {
    const sessionId = useSearchParams().get('sessionId') ?? undefined;
    return <JournalEditor sessionId={sessionId} />;
}

export default function NewJournalEntryPage() {
    return (
        <main className="mx-auto max-w-2xl">
            <PageHeader title="New Entry" showBack />
            <Suspense fallback={null}>
                <JournalEditorFromQuery />
            </Suspense>
        </main>
    );
}
