'use client';

import { useState } from 'react';

import type { GoalArea, Technique } from '@/types';
import { TechniqueCard } from '@components/library/TechniqueCard';

interface LibraryFiltersProps {
    techniques: Technique[];
}

const goalAreaLabels: Record<GoalArea, string> = {
    'stress-anxiety': 'Stress & Anxiety',
    pain: 'Pain',
    sleep: 'Sleep',
    habits: 'Habits',
    performance: 'Performance',
    ibs: 'IBS',
    childbirth: 'Childbirth',
    'general-relaxation': 'Relaxation',
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

export function LibraryFilters({ techniques }: LibraryFiltersProps) {
    const [search, setSearch] = useState('');
    const [selectedAreas, setSelectedAreas] = useState<Set<GoalArea>>(new Set());

    const toggleArea = (area: GoalArea) => {
        setSelectedAreas(prev => {
            const next = new Set(prev);
            if (next.has(area)) {
                next.delete(area);
            } else {
                next.add(area);
            }
            return next;
        });
    };

    const filtered = techniques.filter(t => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
            query === '' ||
            t.name.toLowerCase().includes(query) ||
            t.tagline.toLowerCase().includes(query);

        const matchesArea = selectedAreas.size === 0 || t.goalAreas.some(a => selectedAreas.has(a));

        return matchesSearch && matchesArea;
    });

    return (
        <div className="flex flex-col gap-4">
            <input
                type="search"
                placeholder="Search techniques…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                aria-label="Search techniques"
            />

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by goal area">
                {ALL_GOAL_AREAS.map(area => (
                    <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        aria-pressed={selectedAreas.has(area)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedAreas.has(area)
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                    >
                        {goalAreaLabels[area]}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                    No techniques match your filters.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filtered.map(t => (
                        <TechniqueCard key={t.id} technique={t} />
                    ))}
                </div>
            )}
        </div>
    );
}
