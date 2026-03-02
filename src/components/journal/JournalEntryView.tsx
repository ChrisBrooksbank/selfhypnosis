'use client';

import { useLiveQuery } from '@hooks/useDexieQuery';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@components/layout/PageHeader';
import type { JournalEntry } from '@lib/db';
import { db } from '@lib/db';
import { Logger } from '@utils/logger';

import { MoodDepthPicker } from './MoodDepthPicker';

const MOOD_EMOJIS: Record<number, string> = { 1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊' };
const DEPTH_LABELS: Record<number, string> = {
    1: 'Light',
    2: 'Mild',
    3: 'Moderate',
    4: 'Deep',
    5: 'Very Deep',
};

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface EditState {
    body: string;
    moodBefore: number | undefined;
    moodAfter: number | undefined;
    depthRating: number | undefined;
    tagsInput: string;
    techniqueNotes: string;
}

function entryToEditState(entry: JournalEntry): EditState {
    return {
        body: entry.body,
        moodBefore: entry.moodBefore,
        moodAfter: entry.moodAfter,
        depthRating: entry.depthRating,
        tagsInput: entry.tags.join(', '),
        techniqueNotes: entry.techniqueNotes ?? '',
    };
}

interface JournalEntryViewProps {
    entryId: string;
}

export function JournalEntryView({ entryId }: JournalEntryViewProps) {
    const router = useRouter();
    const entry = useLiveQuery(() => db.journal.get(entryId), [entryId]);

    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Initialise edit state when entry loads
    useEffect(() => {
        if (entry && editState === null) {
            setEditState(entryToEditState(entry));
        }
    }, [entry, editState]);

    const handleStartEdit = useCallback(() => {
        if (entry) {
            setEditState(entryToEditState(entry));
            setIsEditing(true);
        }
    }, [entry]);

    const handleCancelEdit = useCallback(() => {
        if (entry) {
            setEditState(entryToEditState(entry));
        }
        setIsEditing(false);
    }, [entry]);

    const handleSave = useCallback(async () => {
        if (!entry || !editState || !editState.body.trim()) return;

        setIsSaving(true);
        try {
            const parsedTags = editState.tagsInput
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            const updated: JournalEntry = {
                ...entry,
                body: editState.body.trim(),
                moodBefore: editState.moodBefore,
                moodAfter: editState.moodAfter,
                depthRating: editState.depthRating,
                tags: parsedTags,
                techniqueNotes: editState.techniqueNotes.trim() || undefined,
                updatedAt: new Date().toISOString(),
            };

            await db.journal.put(updated);
            Logger.info(`Journal entry updated: ${entry.id}`);
            setIsEditing(false);
        } catch (err) {
            Logger.error('Failed to update journal entry');
            Logger.error(String(err));
        } finally {
            setIsSaving(false);
        }
    }, [entry, editState]);

    const handleDelete = useCallback(async () => {
        if (!entry) return;

        setIsDeleting(true);
        try {
            await db.journal.delete(entry.id);
            Logger.info(`Journal entry deleted: ${entry.id}`);
            router.push('/journal');
        } catch (err) {
            Logger.error('Failed to delete journal entry');
            Logger.error(String(err));
            setIsDeleting(false);
        }
    }, [entry, router]);

    if (entry === undefined) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
                <p className="text-center text-sm text-gray-400">Loading…</p>
            </main>
        );
    }

    if (entry === null) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
                <PageHeader title="Journal Entry" showBack />
                <p className="text-center text-sm text-gray-500">Entry not found.</p>
            </main>
        );
    }

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <PageHeader title="Journal Entry" showBack />
                {!isEditing && (
                    <button
                        onClick={handleStartEdit}
                        className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Date */}
            <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>

            {isEditing && editState ? (
                /* ─── Edit Mode ─────────────────────────────────────────── */
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="edit-body" className="text-sm font-medium text-gray-700">
                            Your thoughts
                        </label>
                        <textarea
                            id="edit-body"
                            value={editState.body}
                            onChange={e => setEditState(s => s && { ...s, body: e.target.value })}
                            rows={8}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                        />
                    </div>

                    <MoodDepthPicker
                        label="Mood before (1 = low, 5 = great)"
                        value={editState.moodBefore}
                        onChange={v => setEditState(s => s && { ...s, moodBefore: v })}
                        variant="mood"
                    />

                    <MoodDepthPicker
                        label="Mood after (1 = low, 5 = great)"
                        value={editState.moodAfter}
                        onChange={v => setEditState(s => s && { ...s, moodAfter: v })}
                        variant="mood"
                    />

                    <MoodDepthPicker
                        label="Depth of trance"
                        value={editState.depthRating}
                        onChange={v => setEditState(s => s && { ...s, depthRating: v })}
                        variant="depth"
                    />

                    <div className="flex flex-col gap-2">
                        <label htmlFor="edit-tags" className="text-sm font-medium text-gray-700">
                            Tags (comma-separated)
                        </label>
                        <input
                            id="edit-tags"
                            type="text"
                            value={editState.tagsInput}
                            onChange={e =>
                                setEditState(s => s && { ...s, tagsInput: e.target.value })
                            }
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="edit-technique-notes"
                            className="text-sm font-medium text-gray-700"
                        >
                            Technique notes (optional)
                        </label>
                        <textarea
                            id="edit-technique-notes"
                            value={editState.techniqueNotes}
                            onChange={e =>
                                setEditState(s => s && { ...s, techniqueNotes: e.target.value })
                            }
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => void handleSave()}
                            disabled={isSaving || !editState.body.trim()}
                            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                /* ─── View Mode ─────────────────────────────────────────── */
                <div className="flex flex-col gap-6">
                    {/* Mood / Depth summary */}
                    {(entry.moodBefore != null ||
                        entry.moodAfter != null ||
                        entry.depthRating != null) && (
                        <div className="flex flex-wrap gap-3">
                            {entry.moodBefore != null && (
                                <span className="rounded-xl bg-gray-50 px-4 py-2 text-sm text-gray-700">
                                    Mood before: {MOOD_EMOJIS[entry.moodBefore]} {entry.moodBefore}
                                    /5
                                </span>
                            )}
                            {entry.moodAfter != null && (
                                <span className="rounded-xl bg-gray-50 px-4 py-2 text-sm text-gray-700">
                                    Mood after: {MOOD_EMOJIS[entry.moodAfter]} {entry.moodAfter}/5
                                </span>
                            )}
                            {entry.depthRating != null && (
                                <span className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                                    Depth: {DEPTH_LABELS[entry.depthRating]} ({entry.depthRating}
                                    /5)
                                </span>
                            )}
                        </div>
                    )}

                    {/* Session link */}
                    {entry.sessionId != null && (
                        <p className="text-xs text-gray-400">Linked to session {entry.sessionId}</p>
                    )}

                    {/* Body */}
                    <div className="rounded-xl bg-gray-50 px-5 py-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                            {entry.body}
                        </p>
                    </div>

                    {/* Technique notes */}
                    {entry.techniqueNotes && (
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                                Technique Notes
                            </h3>
                            <p className="text-sm whitespace-pre-wrap text-gray-700">
                                {entry.techniqueNotes}
                            </p>
                        </div>
                    )}

                    {/* Tags */}
                    {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {entry.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Delete section */}
                    {showDeleteConfirm ? (
                        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-700">
                                Are you sure you want to delete this entry? This cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => void handleDelete()}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting…' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            Delete Entry
                        </button>
                    )}
                </div>
            )}
        </main>
    );
}
