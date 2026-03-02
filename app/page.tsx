export default function Home() {
    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6">
            <h1 className="mb-4 text-3xl font-bold text-indigo-900">Self-Hypnosis</h1>
            <p className="mb-8 text-center text-gray-600">
                Your guide to focused self-care. Technique library, guided sessions, and personal
                suggestion builder.
            </p>
            <div className="w-full space-y-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-800">Getting Started</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        The app is scaffolded and ready for development.
                    </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-800">Status</h2>
                    <p className="mt-1">
                        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                            Running
                        </span>
                    </p>
                </div>
            </div>
        </main>
    );
}
