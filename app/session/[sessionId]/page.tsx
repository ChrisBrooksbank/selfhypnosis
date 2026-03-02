export function generateStaticParams() {
    // Session IDs are runtime UUIDs stored in IndexedDB.
    // A placeholder is exported so the static build succeeds; real navigation is client-side.
    return [{ sessionId: 'placeholder' }];
}

interface Props {
    params: Promise<{ sessionId: string }>;
}

export default async function SessionPlayerPage({ params }: Props) {
    const { sessionId } = await params;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6">
            <h1 className="mb-4 text-2xl font-bold text-indigo-300">Session</h1>
            <p className="text-center text-gray-400">{sessionId} — session player coming soon.</p>
        </main>
    );
}
