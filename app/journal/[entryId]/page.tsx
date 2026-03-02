export function generateStaticParams() {
    // Entry IDs are runtime UUIDs stored in IndexedDB.
    // A placeholder is exported so the static build succeeds; real navigation is client-side.
    return [{ entryId: 'placeholder' }];
}

interface Props {
    params: Promise<{ entryId: string }>;
}

export default async function JournalEntryPage({ params }: Props) {
    const { entryId } = await params;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6">
            <h1 className="mb-4 text-2xl font-bold text-indigo-900">Journal Entry</h1>
            <p className="text-center text-gray-600">{entryId} — journal entry coming soon.</p>
        </main>
    );
}
