'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { db } from '@lib/db';
import { Logger } from '@utils/logger';

interface SessionSummaryProps {
    sessionId: string;
}

interface RatingPickerProps {
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
}

function RatingPicker({ label, value, onChange }: RatingPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex gap-2" role="group" aria-label={label}>
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        aria-pressed={value === n}
                        className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${
                            value === n
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function SessionSummary({ sessionId }: SessionSummaryProps) {
    const router = useRouter();

    const [depthRating, setDepthRating] = useState<number | undefined>();
    const [moodBefore, setMoodBefore] = useState<number | undefined>();
    const [moodAfter, setMoodAfter] = useState<number | undefined>();
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showJournalPrompt, setShowJournalPrompt] = useState(false);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            await db.sessions.update(sessionId, {
                depthRating,
                moodBefore,
                moodAfter,
                notes: notes.trim() || undefined,
            });
            Logger.info(`Session summary saved for: ${sessionId}`);
            setShowJournalPrompt(true);
        } catch (err) {
            Logger.error('Failed to save session summary');
            Logger.error(String(err));
        } finally {
            setIsSaving(false);
        }
    }, [sessionId, depthRating, moodBefore, moodAfter, notes]);

    if (showJournalPrompt) {
        return (
            <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
                <div className="text-5xl" aria-hidden="true">
                    ✓
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Session Complete</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Would you like to record your thoughts in a journal entry?
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3">
                    <button
                        onClick={() => router.push(`/journal/new?sessionId=${sessionId}`)}
                        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Open Journal
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 px-6 py-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">How did it go?</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Rate your experience to track your progress over time.
                </p>
            </div>

            <RatingPicker
                label="How deep did you go? (1 = light, 5 = very deep)"
                value={depthRating}
                onChange={setDepthRating}
            />

            <RatingPicker
                label="Mood before (1 = low, 5 = great)"
                value={moodBefore}
                onChange={setMoodBefore}
            />

            <RatingPicker
                label="Mood after (1 = low, 5 = great)"
                value={moodAfter}
                onChange={setMoodAfter}
            />

            <div className="flex flex-col gap-2">
                <label htmlFor="session-notes" className="text-sm font-medium text-gray-700">
                    Notes (optional)
                </label>
                <textarea
                    id="session-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any observations or insights…"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isSaving ? 'Saving…' : 'Save & Continue'}
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}
