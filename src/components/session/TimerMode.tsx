'use client';

/**
 * TimerMode — freestyle self-hypnosis timer without guided scripts.
 *
 * Features:
 * - Duration slider (5–60 min, defaults to user's defaultSessionDuration)
 * - Large countdown display while running
 * - Randomly-ordered technique prompt cards drawn from preferredTechniques
 * - Records a SessionRecord (type: 'timer') for streak tracking
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@lib/db';
import { useSessionEngine } from '@hooks/useSessionEngine';
import { Logger } from '@utils/logger';
import type { TechniqueId } from '@/types';

import eyeFixationData from '@/content/techniques/eye-fixation.json';
import pmrData from '@/content/techniques/pmr.json';
import visualisationData from '@/content/techniques/visualisation.json';
import countdownData from '@/content/techniques/countdown.json';
import breathingData from '@/content/techniques/breathing.json';
import sensory321Data from '@/content/techniques/321-sensory.json';
import autogenicData from '@/content/techniques/autogenic.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechniquePrompt {
    id: TechniqueId;
    name: string;
    tagline: string;
    hint: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const ALL_PROMPTS: TechniquePrompt[] = [
    eyeFixationData,
    pmrData,
    visualisationData,
    countdownData,
    breathingData,
    sensory321Data,
    autogenicData,
].map(t => ({
    id: t.id as TechniqueId,
    name: t.name,
    tagline: t.tagline,
    hint: t.steps[0]?.instruction ?? '',
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimerMode() {
    const settings = useLiveQuery(() => db.settings.get('user'));

    const [duration, setDuration] = useState(20);
    const [isComplete, setIsComplete] = useState(false);
    const [cardIndex, setCardIndex] = useState(0);

    const durationInitialized = useRef(false);
    const hasBeenRunning = useRef(false);
    const manualStopRef = useRef(false);

    const { timeRemaining, isRunning, isPaused, start, pause, resume, stop } = useSessionEngine();

    // Initialise duration from settings once (don't override user's slider changes).
    useEffect(() => {
        if (!durationInitialized.current && settings !== undefined) {
            durationInitialized.current = true;
            setDuration(settings?.defaultSessionDuration ?? 20);
        }
    }, [settings]);

    // Track whether the session has ever been running so we can detect completion.
    useEffect(() => {
        if (isRunning) {
            hasBeenRunning.current = true;
        }
    }, [isRunning]);

    // Detect natural completion vs manual stop.
    useEffect(() => {
        if (hasBeenRunning.current && !isRunning) {
            if (!manualStopRef.current) {
                setIsComplete(true);
            }
            hasBeenRunning.current = false;
            manualStopRef.current = false;
        }
    }, [isRunning]);

    // Build a shuffled list of prompts filtered to preferred techniques.
    const prompts = useMemo(() => {
        const preferred = settings?.preferredTechniques ?? [];
        const filtered =
            preferred.length > 0 ? ALL_PROMPTS.filter(p => preferred.includes(p.id)) : [];
        const pool = filtered.length > 0 ? filtered : ALL_PROMPTS;
        return shuffle(pool);
    }, [settings?.preferredTechniques]);

    const currentPrompt = prompts[cardIndex % prompts.length];

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleStart = useCallback(() => {
        const id = generateId();
        setIsComplete(false);
        setCardIndex(0);
        hasBeenRunning.current = false;
        manualStopRef.current = false;
        start({ sessionId: id, type: 'timer', plannedDurationMinutes: duration });
        Logger.info(`Timer mode started: ${id} (${duration} min)`);
    }, [duration, start]);

    const handleStop = useCallback(() => {
        manualStopRef.current = true;
        stop();
    }, [stop]);

    const handleNextCard = useCallback(() => {
        setCardIndex(i => i + 1);
    }, []);

    const handleReset = useCallback(() => {
        setIsComplete(false);
    }, []);

    // ── Render: Complete ──────────────────────────────────────────────────────

    if (isComplete) {
        return (
            <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <svg
                        className="h-8 w-8 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Session Complete</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Great work. Your practice has been recorded.
                    </p>
                </div>
                <button
                    onClick={handleReset}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    Start Another
                </button>
            </div>
        );
    }

    // ── Render: Running / Paused ──────────────────────────────────────────────

    if (isRunning || isPaused) {
        return (
            <div className="flex flex-col items-center gap-6">
                {/* Countdown */}
                <div
                    className="flex flex-col items-center gap-1 rounded-2xl bg-indigo-50 px-10 py-8"
                    aria-live="polite"
                    aria-label={`${formatTime(timeRemaining)} remaining`}
                >
                    <span className="font-mono text-6xl font-bold text-indigo-600 tabular-nums">
                        {formatTime(timeRemaining)}
                    </span>
                    <span className="text-sm text-indigo-400">
                        {isPaused ? 'Paused' : 'remaining'}
                    </span>
                </div>

                {/* Technique prompt card */}
                {currentPrompt !== undefined && (
                    <div className="w-full rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
                        <div className="mb-2 text-xs font-medium tracking-wide text-indigo-400 uppercase">
                            Technique Suggestion
                        </div>
                        <h4 className="mb-1 text-base font-semibold text-gray-900">
                            {currentPrompt.name}
                        </h4>
                        <p className="text-sm text-gray-500 italic">{currentPrompt.tagline}</p>
                        <p className="mt-3 text-sm leading-relaxed text-gray-700">
                            {currentPrompt.hint}
                        </p>
                        {prompts.length > 1 && (
                            <button
                                onClick={handleNextCard}
                                className="mt-4 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                            >
                                Next suggestion →
                            </button>
                        )}
                    </div>
                )}

                {/* Controls */}
                <div className="flex w-full gap-3">
                    <button
                        onClick={isPaused ? resume : pause}
                        className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                        onClick={handleStop}
                        className="flex-1 rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
                    >
                        Stop
                    </button>
                </div>
            </div>
        );
    }

    // ── Render: Setup ─────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-6">
            <p className="text-sm text-gray-600">
                Practise freely without a guided script. Set your duration and use technique
                suggestions as inspiration during your session.
            </p>

            {/* Duration slider */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="timer-duration" className="text-sm font-medium text-gray-800">
                        Duration
                    </label>
                    <span className="text-sm font-semibold text-indigo-600">{duration} min</span>
                </div>
                <input
                    id="timer-duration"
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>5 min</span>
                    <span>60 min</span>
                </div>
            </div>

            {/* Preview of what techniques will be suggested */}
            {settings?.preferredTechniques && settings.preferredTechniques.length > 0 && (
                <p className="text-xs text-gray-500">
                    Suggestions will draw from your preferred techniques:{' '}
                    {prompts.map(p => p.name).join(', ')}.
                </p>
            )}

            <button
                onClick={handleStart}
                className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
            >
                Start {duration}-Minute Timer
            </button>
        </div>
    );
}
