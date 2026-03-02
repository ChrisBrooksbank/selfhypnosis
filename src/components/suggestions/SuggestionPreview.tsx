'use client';

import { useState } from 'react';

import type { GoalArea } from '@/types';
import { db } from '@lib/db';
import type { ValidationCriteria } from '@lib/suggestions/validator';
import { Logger } from '@utils/logger';

interface SuggestionPreviewProps {
    text: string;
    goalArea: GoalArea;
    score: number;
    guidelineCriteria: ValidationCriteria;
    onSave: () => void;
    onBack: () => void;
}

export function SuggestionPreview({
    text,
    goalArea,
    score,
    guidelineCriteria,
    onSave,
    onBack,
}: SuggestionPreviewProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isFavourite, setIsFavourite] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleAddTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed]);
        }
        setTagInput('');
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const id = crypto.randomUUID();
            await db.suggestions.add({
                id,
                goalArea,
                text,
                tags,
                validationScore: score,
                guidelineFlags: {
                    isPositive: guidelineCriteria.positiveFraming,
                    isPresentTense: guidelineCriteria.presentTense,
                    isSpecific: guidelineCriteria.specific,
                    isBelievable: guidelineCriteria.believable,
                    isEmotional: guidelineCriteria.emotionallyEngaging,
                },
                isFavourite,
                usageCount: 0,
                createdAt: new Date().toISOString(),
            });
            Logger.success('Custom suggestion saved');
            onSave();
        } catch (err) {
            Logger.error('Failed to save suggestion', err);
            setSaveError('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Session-styled preview */}
            <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                    Preview — how it appears during a session:
                </p>
                <div className="rounded-2xl bg-indigo-950 px-6 py-8 text-center shadow-lg">
                    <p className="mb-3 text-xs font-medium tracking-widest text-indigo-400 uppercase">
                        Suggestion Phase
                    </p>
                    <p className="text-xl leading-relaxed font-light text-white italic">{text}</p>
                </div>
            </div>

            {/* Tags input */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tags{' '}
                    <span className="font-normal text-gray-500">
                        (optional, press Enter to add)
                    </span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={handleAddTag}
                        placeholder="e.g. morning, relaxation"
                        className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleAddTag}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                        Add
                    </button>
                </div>
                {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    aria-label={`Remove tag ${tag}`}
                                    className="flex h-4 w-4 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-200 hover:text-indigo-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Favourite toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden="true">
                        {isFavourite ? '★' : '☆'}
                    </span>
                    <span className="text-sm font-medium text-gray-800">Mark as favourite</span>
                </div>
                <input
                    type="checkbox"
                    checked={isFavourite}
                    onChange={e => setIsFavourite(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
            </label>

            {saveError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {saveError}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || score < 3}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? 'Saving…' : 'Save Suggestion'}
                </button>
            </div>

            {score < 3 && (
                <p className="text-center text-xs text-gray-500">
                    Score must be 3 or higher to save. Go back and improve your suggestion.
                </p>
            )}
        </div>
    );
}
