'use client';

import { useLiveQuery } from '@hooks/useDexieQuery';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@components/layout/PageHeader';
import { db } from '@lib/db';

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function firstLine(body: string): string {
    const line = body.split('\n')[0] ?? '';
    return line.length > 80 ? line.slice(0, 80) + '…' : line;
}

export default function JournalPage() {
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const entries = useLiveQuery(() => db.journal.orderBy('createdAt').reverse().toArray(), []);

    // Collect all unique tags across entries
    const allTags = [...new Set((entries ?? []).flatMap(e => e.tags))].sort();

    const filtered =
        activeTag == null
            ? (entries ?? [])
            : (entries ?? []).filter(e => e.tags.includes(activeTag));

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
            <div className="flex items-center justify-between">
                <PageHeader title="Journal" />
                <Link
                    href="/journal/new"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    + New Entry
                </Link>
            </div>

            {/* Tag filter chips */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTag(null)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            activeTag === null
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                    >
                        All
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                activeTag === tag
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Entry list */}
            {entries === undefined ? (
                <p className="text-center text-sm text-gray-400">Loading…</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <p className="text-gray-500">
                        {activeTag != null
                            ? `No entries tagged "${activeTag}".`
                            : 'No journal entries yet.'}
                    </p>
                    {activeTag == null && (
                        <Link
                            href="/journal/new"
                            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Write your first entry
                        </Link>
                    )}
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {filtered.map(entry => (
                        <li key={entry.id}>
                            <Link
                                href={`/journal/${entry.id}`}
                                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                            >
                                {/* Date row */}
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-400">
                                        {formatDate(entry.createdAt)}
                                    </span>
                                    {/* Mood before → after */}
                                    {(entry.moodBefore != null || entry.moodAfter != null) && (
                                        <span className="text-sm">
                                            {entry.moodBefore != null
                                                ? MOOD_EMOJIS[entry.moodBefore]
                                                : '—'}
                                            {' → '}
                                            {entry.moodAfter != null
                                                ? MOOD_EMOJIS[entry.moodAfter]
                                                : '—'}
                                        </span>
                                    )}
                                </div>

                                {/* First line of body */}
                                <p className="mb-2 text-sm text-gray-800">
                                    {firstLine(entry.body)}
                                </p>

                                {/* Depth + tags */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {entry.depthRating != null && (
                                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                            Depth {entry.depthRating}/5
                                        </span>
                                    )}
                                    {entry.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
