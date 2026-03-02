'use client';

import { PageHeader } from '@components/layout/PageHeader';
import { JournalEditor } from '@components/journal/JournalEditor';

export default function NewJournalEntryPage() {
    return (
        <main className="mx-auto max-w-2xl">
            <PageHeader title="New Entry" showBack />
            <JournalEditor />
        </main>
    );
}
