import type { GoalArea } from '@/types';

interface GoalAreaPickerProps {
    value: GoalArea | null;
    onChange: (area: GoalArea) => void;
}

const goalAreas: { id: GoalArea; label: string; icon: string; description: string }[] = [
    {
        id: 'stress-anxiety',
        label: 'Stress & Anxiety',
        icon: '🧘',
        description: 'Calm the mind and ease worry',
    },
    {
        id: 'pain',
        label: 'Pain Management',
        icon: '💊',
        description: 'Reduce and manage discomfort',
    },
    { id: 'sleep', label: 'Sleep', icon: '🌙', description: 'Drift into deep, restful sleep' },
    { id: 'habits', label: 'Habits', icon: '⚡', description: 'Build positive, lasting patterns' },
    {
        id: 'performance',
        label: 'Performance',
        icon: '🏆',
        description: 'Unlock confidence and focus',
    },
    { id: 'ibs', label: 'IBS Relief', icon: '🌿', description: 'Support digestive calm' },
    { id: 'childbirth', label: 'Childbirth', icon: '🌸', description: 'Prepare for a calm birth' },
    {
        id: 'general-relaxation',
        label: 'General Relaxation',
        icon: '☁️',
        description: 'Deep peace and wellbeing',
    },
];

export function GoalAreaPicker({ value, onChange }: GoalAreaPickerProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {goalAreas.map(area => {
                const isSelected = value === area.id;
                return (
                    <button
                        key={area.id}
                        type="button"
                        onClick={() => onChange(area.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                            isSelected
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                        aria-pressed={isSelected}
                    >
                        <span className="text-3xl" aria-hidden="true">
                            {area.icon}
                        </span>
                        <span
                            className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}
                        >
                            {area.label}
                        </span>
                        <span
                            className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}
                        >
                            {area.description}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
