'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import type { JournalEntry } from '@lib/db';
import { db } from '@lib/db';
import { Logger } from '@utils/logger';

import { MoodDepthPicker } from './MoodDepthPicker';

interface JournalEditorProps {
    sessionId?: string;
    onSave?: (entry: JournalEntry) => void;
}

export function JournalEditor({ sessionId, onSave }: JournalEditorProps) {
    const router = useRouter();

    const [body, setBody] = useState('');
    const [moodBefore, setMoodBefore] = useState<number | undefined>();
    const [moodAfter, setMoodAfter] = useState<number | undefined>();
    const [depthRating, setDepthRating] = useState<number | undefined>();
    const [tagsInput, setTagsInput] = useState('');
    const [techniqueNotes, setTechniqueNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    const handleSave = useCallback(async () => {
        if (!body.trim()) return;

        setIsSaving(true);
        try {
            const now = new Date().toISOString();
            const entry: JournalEntry = {
                id: crypto.randomUUID(),
                sessionId: sessionId ?? undefined,
                body: body.trim(),
                moodBefore,
                moodAfter,
                depthRating,
                tags: parsedTags,
                techniqueNotes: techniqueNotes.trim() || undefined,
                createdAt: now,
                updatedAt: now,
            };

            await db.journal.add(entry);
            Logger.info(`Journal entry saved: ${entry.id}`);

            if (onSave) {
                onSave(entry);
            } else {
                router.push('/journal');
            }
        } catch (err) {
            Logger.error('Failed to save journal entry');
            Logger.error(String(err));
        } finally {
            setIsSaving(false);
        }
    }, [
        body,
        moodBefore,
        moodAfter,
        depthRating,
        parsedTags,
        techniqueNotes,
        sessionId,
        onSave,
        router,
    ]);

    return (
        <div className="flex flex-col gap-6 px-6 py-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">New Journal Entry</h2>
                {sessionId && <p className="mt-1 text-sm text-gray-500">Linked to your session</p>}
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="journal-body" className="text-sm font-medium text-gray-700">
                    Your thoughts
                </label>
                <textarea
                    id="journal-body"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={6}
                    placeholder="What did you notice? How did you feel?"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
            </div>

            <MoodDepthPicker
                label="Mood before (1 = low, 5 = great)"
                value={moodBefore}
                onChange={setMoodBefore}
                variant="mood"
            />

            <MoodDepthPicker
                label="Mood after (1 = low, 5 = great)"
                value={moodAfter}
                onChange={setMoodAfter}
                variant="mood"
            />

            <MoodDepthPicker
                label="Depth of trance"
                value={depthRating}
                onChange={setDepthRating}
                variant="depth"
            />

            <div className="flex flex-col gap-2">
                <label htmlFor="journal-tags" className="text-sm font-medium text-gray-700">
                    Tags (optional, comma-separated)
                </label>
                <input
                    id="journal-tags"
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="e.g. sleep, relaxation, insight"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
                {parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {parsedTags.map(tag => (
                            <span
                                key={tag}
                                className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label
                    htmlFor="journal-technique-notes"
                    className="text-sm font-medium text-gray-700"
                >
                    Technique notes (optional)
                </label>
                <textarea
                    id="journal-technique-notes"
                    value={techniqueNotes}
                    onChange={e => setTechniqueNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes about specific techniques you tried…"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={() => void handleSave()}
                    disabled={isSaving || !body.trim()}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isSaving ? 'Saving…' : 'Save Entry'}
                </button>
                <button
                    onClick={() => router.back()}
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
