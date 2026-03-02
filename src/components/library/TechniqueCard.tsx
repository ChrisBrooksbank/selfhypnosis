import Link from 'next/link';

import type { GoalArea, Technique } from '@/types';

interface TechniqueCardProps {
    technique: Technique;
}

const difficultyConfig = {
    beginner: { label: 'Beginner', className: 'bg-green-100 text-green-700' },
    intermediate: { label: 'Intermediate', className: 'bg-yellow-100 text-yellow-700' },
    advanced: { label: 'Advanced', className: 'bg-red-100 text-red-700' },
} as const;

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

export function TechniqueCard({ technique }: TechniqueCardProps) {
    const difficulty = difficultyConfig[technique.difficultyLevel];

    return (
        <Link
            href={`/library/${technique.id}`}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900">{technique.name}</h2>
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficulty.className}`}
                >
                    {difficulty.label}
                </span>
            </div>
            <p className="text-sm text-gray-600">{technique.tagline}</p>
            <div className="flex flex-wrap gap-1.5">
                {technique.goalAreas.map(area => (
                    <span
                        key={area}
                        className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                        {goalAreaLabels[area]}
                    </span>
                ))}
            </div>
        </Link>
    );
}
