'use client';

import { useCallback, useEffect, useState } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

import { PageHeader } from '@components/layout/PageHeader';
import { Statistics } from '@components/settings/Statistics';
import { useNotifications } from '@hooks/useNotifications';
import { db } from '@lib/db';
import type { TechniqueId } from '@/types';
import { Logger } from '@utils/logger';

const ALL_TECHNIQUES: { id: TechniqueId; name: string }[] = [
    { id: 'eye-fixation', name: 'Eye Fixation' },
    { id: 'pmr', name: 'Progressive Muscle Relaxation' },
    { id: 'visualisation', name: 'Visualisation' },
    { id: 'countdown', name: 'Countdown' },
    { id: 'breathing', name: 'Breathing' },
    { id: '321-sensory', name: '3-2-1 Sensory' },
    { id: 'autogenic', name: 'Autogenic' },
];

type Theme = 'light' | 'dark' | 'system';
type ClearState = 'idle' | 'confirm1' | 'confirm2';

function applyTheme(theme: Theme): void {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
    } else if (theme === 'light') {
        html.classList.remove('dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) html.classList.add('dark');
        else html.classList.remove('dark');
    }
}

export default function SettingsPage() {
    const settings = useLiveQuery(() => db.settings.get('user'));
    const notifications = useNotifications();
    const [clearState, setClearState] = useState<ClearState>('idle');

    // Apply persisted theme on load
    useEffect(() => {
        if (settings?.theme) {
            applyTheme(settings.theme);
        }
    }, [settings?.theme]);

    const updateDuration = useCallback(async (value: number) => {
        await db.settings.update('user', { defaultSessionDuration: value });
        Logger.info(`Default session duration updated to ${value} min`);
    }, []);

    const toggleTechnique = useCallback(async (id: TechniqueId, current: TechniqueId[]) => {
        const next = current.includes(id) ? current.filter(t => t !== id) : [...current, id];
        await db.settings.update('user', { preferredTechniques: next });
        Logger.info('Preferred techniques updated');
    }, []);

    const updateTheme = useCallback(async (theme: Theme) => {
        await db.settings.update('user', { theme });
        applyTheme(theme);
        Logger.info(`Theme updated to ${theme}`);
    }, []);

    const exportData = useCallback(async () => {
        const [settingsData, sessionsData, suggestionsData, journalData] = await Promise.all([
            db.settings.toArray(),
            db.sessions.toArray(),
            db.suggestions.toArray(),
            db.journal.toArray(),
        ]);

        const payload = {
            exportedAt: new Date().toISOString(),
            settings: settingsData,
            sessions: sessionsData,
            suggestions: suggestionsData,
            journal: journalData,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selfhypnosis-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Logger.info('Data exported');
    }, []);

    const clearData = useCallback(async () => {
        await Promise.all([
            db.settings.clear(),
            db.sessions.clear(),
            db.suggestions.clear(),
            db.journal.clear(),
        ]);
        setClearState('idle');
        Logger.info('All data cleared');
        window.location.href = '/onboarding';
    }, []);

    if (settings === undefined) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
                <PageHeader title="Settings" />
                <p className="text-sm text-gray-400">Loading…</p>
            </main>
        );
    }

    const currentDuration = settings?.defaultSessionDuration ?? 20;
    const currentTechniques = settings?.preferredTechniques ?? [];
    const currentTheme = settings?.theme ?? 'system';

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 pb-24">
            <PageHeader title="Settings" />

            {/* In-app notification banner */}
            {notifications.showBanner && (
                <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                    <p className="text-sm text-indigo-700">Time for your daily practice!</p>
                    <button
                        onClick={notifications.dismissBanner}
                        className="text-xs text-indigo-500 hover:text-indigo-700"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Preferences */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Preferences
                </h2>

                {/* Duration slider */}
                <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="duration-slider"
                            className="text-sm font-medium text-gray-700"
                        >
                            Default Session Duration
                        </label>
                        <span className="text-sm font-semibold text-indigo-600">
                            {currentDuration} min
                        </span>
                    </div>
                    <input
                        id="duration-slider"
                        type="range"
                        min={10}
                        max={45}
                        step={5}
                        value={currentDuration}
                        onChange={e => updateDuration(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>10 min</span>
                        <span>45 min</span>
                    </div>
                </div>

                {/* Preferred techniques */}
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Preferred Techniques</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Used for timer mode technique prompts.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_TECHNIQUES.map(({ id, name }) => {
                            const selected = currentTechniques.includes(id);
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleTechnique(id, currentTechniques)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                        selected
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                                    }`}
                                >
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Theme toggle */}
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-700">Theme</p>
                    <div className="flex gap-2">
                        {(['light', 'dark', 'system'] as Theme[]).map(t => (
                            <button
                                key={t}
                                onClick={() => updateTheme(t)}
                                className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                                    currentTheme === t
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Notifications
                </h2>
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    {notifications.permissionState === 'unsupported' ? (
                        <p className="text-sm text-gray-400">
                            Notifications are not supported on this device.
                        </p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Daily Reminder
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {notifications.permissionState === 'denied'
                                            ? 'Notifications blocked — please update browser settings.'
                                            : 'Get a daily nudge to practise.'}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (notifications.notificationsEnabled) {
                                            await notifications.disableNotifications();
                                        } else {
                                            await notifications.enableNotifications(
                                                notifications.notificationTime ?? '09:00'
                                            );
                                        }
                                    }}
                                    disabled={notifications.permissionState === 'denied'}
                                    aria-pressed={notifications.notificationsEnabled}
                                    aria-label="Toggle daily reminder"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                                        notifications.notificationsEnabled
                                            ? 'bg-indigo-600'
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                            notifications.notificationsEnabled
                                                ? 'translate-x-6'
                                                : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            {notifications.notificationsEnabled && (
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="notification-time"
                                        className="text-sm text-gray-600"
                                    >
                                        Reminder time
                                    </label>
                                    <input
                                        id="notification-time"
                                        type="time"
                                        value={notifications.notificationTime ?? '09:00'}
                                        onChange={e =>
                                            notifications.setNotificationTime(e.target.value)
                                        }
                                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Statistics */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Statistics
                </h2>
                <Statistics />
            </section>

            {/* Data management */}
            <section className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Data
                </h2>
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <button
                        onClick={exportData}
                        className="w-full rounded-xl border border-indigo-300 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
                    >
                        Export all data (JSON)
                    </button>

                    {clearState === 'idle' && (
                        <button
                            onClick={() => setClearState('confirm1')}
                            className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                            Clear all data
                        </button>
                    )}

                    {clearState === 'confirm1' && (
                        <div className="space-y-2 rounded-xl bg-red-50 p-3">
                            <p className="text-sm font-medium text-red-700">
                                Are you sure? All sessions, journal entries, and suggestions will be
                                deleted.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setClearState('idle')}
                                    className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setClearState('confirm2')}
                                    className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </div>
                    )}

                    {clearState === 'confirm2' && (
                        <div className="space-y-2 rounded-xl bg-red-50 p-3">
                            <p className="text-sm font-semibold text-red-700">
                                This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setClearState('idle')}
                                    className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={clearData}
                                    className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-800"
                                >
                                    Delete everything
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
