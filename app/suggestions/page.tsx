'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@components/layout/PageHeader';
import { db } from '@lib/db';
import type { GoalArea } from '@/types';
import { Logger } from '@utils/logger';

type SortOption = 'date' | 'usage';

const GOAL_AREA_LABELS: Record<GoalArea, string> = {
    'stress-anxiety': 'Stress & Anxiety',
    pain: 'Pain Management',
    sleep: 'Sleep',
    habits: 'Habits',
    performance: 'Performance',
    ibs: 'IBS Relief',
    childbirth: 'Childbirth',
    'general-relaxation': 'General Relaxation',
};

const ALL_GOAL_AREAS: GoalArea[] = [
    'stress-anxiety',
    'pain',
    'sleep',
    'habits',
    'performance',
    'ibs',
    'childbirth',
    'general-relaxation',
];

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function StarScore({ score }: { score: number }) {
    return (
        <span className="text-sm" aria-label={`Score ${score} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < score ? 'text-yellow-400' : 'text-gray-200'}>
                    ★
                </span>
            ))}
        </span>
    );
}

export default function SuggestionsPage() {
    const [goalAreaFilter, setGoalAreaFilter] = useState<GoalArea | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [favouriteOnly, setFavouriteOnly] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const suggestions = useLiveQuery(() => db.suggestions.toArray(), []);

    const filtered = (suggestions ?? [])
        .filter(s => (goalAreaFilter == null ? true : s.goalArea === goalAreaFilter))
        .filter(s => (favouriteOnly ? s.isFavourite : true))
        .sort((a, b) => {
            if (sortBy === 'usage') return b.usageCount - a.usageCount;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const handleDelete = async (id: string) => {
        try {
            await db.suggestions.delete(id);
            Logger.info('Suggestion deleted', { id });
        } catch (err) {
            Logger.error('Failed to delete suggestion', err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <PageHeader title="My Suggestions" />
                <Link
                    href="/suggestions/builder"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    + New
                </Link>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* Sort */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500">Sort:</span>
                    <button
                        onClick={() => setSortBy('date')}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            sortBy === 'date'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                    >
                        Newest
                    </button>
                    <button
                        onClick={() => setSortBy('usage')}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            sortBy === 'usage'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                    >
                        Most Used
                    </button>
                    <button
                        onClick={() => setFavouriteOnly(prev => !prev)}
                        className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            favouriteOnly
                                ? 'bg-yellow-400 text-yellow-900'
                                : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                        }`}
                        aria-pressed={favouriteOnly}
                    >
                        ★ Favourites
                    </button>
                </div>

                {/* Goal area filter chips */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setGoalAreaFilter(null)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            goalAreaFilter === null
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                    >
                        All Areas
                    </button>
                    {ALL_GOAL_AREAS.map(area => (
                        <button
                            key={area}
                            onClick={() => setGoalAreaFilter(prev => (prev === area ? null : area))}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                goalAreaFilter === area
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                        >
                            {GOAL_AREA_LABELS[area]}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {suggestions === undefined ? (
                <p className="text-center text-sm text-gray-400">Loading…</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <p className="text-gray-500">
                        {(suggestions ?? []).length === 0
                            ? 'No suggestions saved yet.'
                            : 'No suggestions match your filters.'}
                    </p>
                    {suggestions.length === 0 && (
                        <Link
                            href="/suggestions/builder"
                            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Create your first suggestion
                        </Link>
                    )}
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {filtered.map(suggestion => (
                        <li key={suggestion.id}>
                            {/* Delete confirmation overlay */}
                            {deletingId === suggestion.id ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                                    <p className="mb-3 text-sm font-medium text-red-800">
                                        Delete this suggestion?
                                    </p>
                                    <p className="mb-4 text-xs text-red-600 italic">
                                        &ldquo;{suggestion.text}&rdquo;
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="flex-1 rounded-xl border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleDelete(suggestion.id)}
                                            className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
                                    {/* Top row */}
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                {GOAL_AREA_LABELS[suggestion.goalArea]}
                                            </span>
                                            {suggestion.isFavourite && (
                                                <span className="text-sm text-yellow-400">★</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setDeletingId(suggestion.id)}
                                            aria-label="Delete suggestion"
                                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* Suggestion text */}
                                    <p className="mb-3 text-sm leading-relaxed text-gray-800 italic">
                                        &ldquo;{suggestion.text}&rdquo;
                                    </p>

                                    {/* Bottom row */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StarScore score={suggestion.validationScore} />
                                            {suggestion.usageCount > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    Used {suggestion.usageCount}×
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {formatDate(suggestion.createdAt)}
                                            </span>
                                        </div>
                                        {suggestion.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {suggestion.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
