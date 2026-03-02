'use client';

interface MoodDepthPickerProps {
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
    variant?: 'mood' | 'depth';
}

const MOOD_EMOJIS: Record<number, string> = {
    1: '😔',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😊',
};

const DEPTH_LABELS: Record<number, string> = {
    1: 'Light',
    2: 'Mild',
    3: 'Moderate',
    4: 'Deep',
    5: 'Very Deep',
};

export function MoodDepthPicker({
    label,
    value,
    onChange,
    variant = 'mood',
}: MoodDepthPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex gap-2" role="group" aria-label={label}>
                {[1, 2, 3, 4, 5].map(n => {
                    const isSelected = value === n;
                    const displayLabel = variant === 'mood' ? MOOD_EMOJIS[n] : String(n);
                    const sublabel = variant === 'depth' ? DEPTH_LABELS[n] : undefined;

                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onChange(n)}
                            aria-pressed={isSelected}
                            aria-label={
                                variant === 'mood'
                                    ? `${MOOD_EMOJIS[n]} (${n} of 5)`
                                    : `${DEPTH_LABELS[n]} (${n} of 5)`
                            }
                            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-center transition-colors ${
                                isSelected
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                        >
                            <span
                                className={variant === 'mood' ? 'text-xl' : 'text-sm font-semibold'}
                            >
                                {displayLabel}
                            </span>
                            {sublabel && (
                                <span
                                    className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}
                                >
                                    {sublabel}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
