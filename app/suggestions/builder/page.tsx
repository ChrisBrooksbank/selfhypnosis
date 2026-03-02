'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { GoalAreaPicker } from '@components/suggestions/GoalAreaPicker';
import { GuidelineChecklist } from '@components/suggestions/GuidelineChecklist';
import { SuggestionEditor } from '@components/suggestions/SuggestionEditor';
import { SuggestionPreview } from '@components/suggestions/SuggestionPreview';
import type { GoalArea } from '@/types';
import { validateSuggestion } from '@lib/suggestions/validator';

const STEPS = [
    { number: 1, label: 'Goal' },
    { number: 2, label: 'Write' },
    { number: 3, label: 'Check' },
    { number: 4, label: 'Save' },
] as const;

export default function SuggestionBuilderPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [goalArea, setGoalArea] = useState<GoalArea | null>(null);
    const [text, setText] = useState('');
    const [believable, setBelievable] = useState(false);
    const [emotionallyEngaging, setEmotionallyEngaging] = useState(false);

    const validation = useMemo(
        () => validateSuggestion(text, { believable, emotionallyEngaging }),
        [text, believable, emotionallyEngaging]
    );

    const canAdvance = (): boolean => {
        if (step === 1) return goalArea !== null;
        if (step === 2) return text.trim().length > 0;
        if (step === 3) return true;
        return false;
    };

    const handleNext = () => {
        if (canAdvance() && step < 4) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
    };

    const handleSaved = () => {
        router.push('/suggestions');
    };

    return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900">Suggestion Builder</h1>
                    <button
                        type="button"
                        onClick={() => router.push('/suggestions')}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                        Cancel
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-1">
                    {STEPS.map((s, i) => {
                        const isCompleted = step > s.number;
                        const isCurrent = step === s.number;
                        return (
                            <div key={s.number} className="flex flex-1 flex-col items-center gap-1">
                                <div className="flex w-full items-center">
                                    <div
                                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                                            isCompleted
                                                ? 'bg-indigo-600 text-white'
                                                : isCurrent
                                                  ? 'border-2 border-indigo-600 bg-white text-indigo-600'
                                                  : 'border-2 border-gray-300 bg-white text-gray-400'
                                        }`}
                                    >
                                        {isCompleted ? '✓' : s.number}
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div
                                            className={`mx-1 h-0.5 flex-1 transition-colors ${
                                                isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                                            }`}
                                        />
                                    )}
                                </div>
                                <span
                                    className={`text-xs font-medium ${
                                        isCurrent ? 'text-indigo-600' : 'text-gray-400'
                                    }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Choose a goal area
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Select the area you want your suggestion to address.
                            </p>
                        </div>
                        <GoalAreaPicker value={goalArea} onChange={setGoalArea} />
                    </div>
                )}

                {step === 2 && goalArea && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Write your suggestion
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Write a short, personal statement you want to believe.
                            </p>
                        </div>
                        <SuggestionEditor goalArea={goalArea} value={text} onChange={setText} />
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Check your suggestion
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Review the guidelines and rate your suggestion.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-indigo-950 px-5 py-4 text-center">
                            <p className="text-base leading-relaxed font-light text-white italic">
                                {text}
                            </p>
                        </div>
                        <GuidelineChecklist
                            result={validation}
                            onBelievableChange={setBelievable}
                            onEmotionallyEngagingChange={setEmotionallyEngaging}
                        />
                    </div>
                )}

                {step === 4 && goalArea && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Preview &amp; save
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Add tags, mark as favourite, then save.
                            </p>
                        </div>
                        <SuggestionPreview
                            text={text}
                            goalArea={goalArea}
                            score={validation.score}
                            guidelineCriteria={validation.criteria}
                            onSave={handleSaved}
                            onBack={handleBack}
                        />
                    </div>
                )}
            </div>

            {/* Bottom navigation (steps 1-3 only; step 4 uses SuggestionPreview's own buttons) */}
            {step < 4 && (
                <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-4">
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canAdvance()}
                            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {step === 3 ? 'Preview' : 'Next'}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
