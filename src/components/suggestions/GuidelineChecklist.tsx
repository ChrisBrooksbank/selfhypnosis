'use client';

import type { ValidationCriteria, ValidationResult } from '@lib/suggestions/validator';

interface GuidelineChecklistProps {
    result: ValidationResult;
    onBelievableChange: (value: boolean) => void;
    onEmotionallyEngagingChange: (value: boolean) => void;
}

interface Criterion {
    key: keyof ValidationCriteria;
    label: string;
    passMessage: string;
    failMessage: string;
    isToggle: boolean;
    toggleLabel?: string;
}

const CRITERIA: Criterion[] = [
    {
        key: 'positiveFraming',
        label: 'Positive framing',
        passMessage: 'No negation words found.',
        failMessage:
            'Avoid words like "not", "don\'t", "never", "stop". State what you want, not what to avoid.',
        isToggle: false,
    },
    {
        key: 'presentTense',
        label: 'Present tense',
        passMessage: 'Written in the present tense.',
        failMessage: 'Avoid "will", "going to", "shall". Write as if it\'s already true.',
        isToggle: false,
    },
    {
        key: 'specific',
        label: 'Specific enough',
        passMessage: 'Suggestion has enough words to be meaningful.',
        failMessage: 'Too short — aim for at least 4 words to make it specific.',
        isToggle: false,
    },
    {
        key: 'believable',
        label: 'Believable',
        passMessage: 'Feels realistic to you right now.',
        failMessage: 'Does this feel realistic to you right now?',
        isToggle: true,
        toggleLabel: 'Yes, this feels realistic to me right now',
    },
    {
        key: 'emotionallyEngaging',
        label: 'Emotionally engaging',
        passMessage: 'Connects to a feeling.',
        failMessage: 'Does this connect to a feeling or emotion?',
        isToggle: true,
        toggleLabel: 'Yes, this connects to a feeling',
    },
];

function StarDisplay({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-1" aria-label={`Score: ${score} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
                <span
                    key={i}
                    className={`text-xl ${i < score ? 'text-yellow-400' : 'text-gray-300'}`}
                    aria-hidden="true"
                >
                    ★
                </span>
            ))}
            <span className="ml-1 text-sm font-medium text-gray-600">{score}/5</span>
        </div>
    );
}

export function GuidelineChecklist({
    result,
    onBelievableChange,
    onEmotionallyEngagingChange,
}: GuidelineChecklistProps) {
    const { criteria, score } = result;

    const handleToggle = (key: keyof ValidationCriteria, checked: boolean) => {
        if (key === 'believable') {
            onBelievableChange(checked);
        } else if (key === 'emotionallyEngaging') {
            onEmotionallyEngagingChange(checked);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Guideline check</h3>
                <StarDisplay score={score} />
            </div>

            <ul className="flex flex-col gap-3">
                {CRITERIA.map(criterion => {
                    const passed = criteria[criterion.key];

                    return (
                        <li
                            key={criterion.key}
                            className={`rounded-xl border px-4 py-3 ${
                                passed
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-amber-200 bg-amber-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`mt-0.5 flex-shrink-0 text-lg ${passed ? 'text-green-500' : 'text-amber-500'}`}
                                    aria-hidden="true"
                                >
                                    {passed ? '✓' : '✗'}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`text-sm font-medium ${passed ? 'text-green-800' : 'text-amber-800'}`}
                                    >
                                        {criterion.label}
                                    </p>
                                    <p
                                        className={`mt-0.5 text-sm ${passed ? 'text-green-700' : 'text-amber-700'}`}
                                    >
                                        {passed ? criterion.passMessage : criterion.failMessage}
                                    </p>
                                    {criterion.isToggle && (
                                        <label className="mt-2 flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={passed}
                                                onChange={e =>
                                                    handleToggle(criterion.key, e.target.checked)
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">
                                                {criterion.toggleLabel}
                                            </span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {score < 3 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <p className="text-sm font-medium text-indigo-800">Keep improving</p>
                    <p className="mt-0.5 text-sm text-indigo-700">
                        Address the flagged items above to reach a score of 3 or higher before
                        saving. Effective suggestions are positive, present-tense, specific,
                        believable, and emotionally resonant.
                    </p>
                </div>
            )}

            {score >= 3 && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <p className="text-sm font-medium text-green-800">
                        {score === 5 ? 'Excellent suggestion!' : 'Good to go!'}
                    </p>
                    <p className="mt-0.5 text-sm text-green-700">
                        {score === 5
                            ? "Your suggestion meets all guidelines. It's ready to save."
                            : 'Your suggestion meets the minimum guidelines and can be saved.'}
                    </p>
                </div>
            )}
        </div>
    );
}
