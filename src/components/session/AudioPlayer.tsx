'use client';

/**
 * AudioPlayer — integrated audio control strip for the session page.
 *
 * Shows play/pause, a seekable progress bar, and current/total time.
 * Hidden automatically when audioManager is in text-only mode (no audio available).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { audioManager } from '@lib/session/audioManager';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    /** Optional extra class names for the wrapper element. */
    className?: string;
}

export function AudioPlayer({ className = '' }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [textOnly, setTextOnly] = useState(true);

    // Whether the user is actively dragging the seek bar.
    const isSeeking = useRef(false);
    // Displayed current time while dragging (avoids jumps during drag).
    const [seekValue, setSeekValue] = useState(0);

    // Poll audioManager state at ~4 Hz for smooth progress updates.
    useEffect(() => {
        const id = setInterval(() => {
            const snap = audioManager.snapshot();
            setIsPlaying(snap.isPlaying);
            setTextOnly(snap.textOnly);

            if (!isSeeking.current) {
                const ct = audioManager.currentTime;
                const dur = audioManager.duration;
                setCurrentTime(ct);
                setDuration(dur);
                setSeekValue(ct);
            }
        }, 250);

        return () => clearInterval(id);
    }, []);

    const handlePlayPause = useCallback(() => {
        const snap = audioManager.snapshot();
        if (snap.isPlaying) {
            audioManager.pause();
        } else {
            audioManager.resume();
        }
    }, []);

    const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        isSeeking.current = true;
        setSeekValue(Number(e.target.value));
    }, []);

    const commitSeek = useCallback(() => {
        isSeeking.current = false;
        setCurrentTime(seekValue);
        audioManager.seek(seekValue);
    }, [seekValue]);

    const handleMouseUp = useCallback<React.MouseEventHandler<HTMLInputElement>>(() => {
        commitSeek();
    }, [commitSeek]);

    const handleTouchEnd = useCallback<React.TouchEventHandler<HTMLInputElement>>(() => {
        commitSeek();
    }, [commitSeek]);

    // Hide when no audio is available for the current session/segment.
    if (textOnly) return null;

    const progress = duration > 0 ? seekValue : 0;

    return (
        <div
            className={`flex flex-col gap-2 rounded-xl bg-white/10 px-4 py-3 ${className}`}
            aria-label="Audio player"
        >
            {/* Progress bar */}
            <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 1}
                step={0.5}
                value={progress}
                onChange={handleSeekChange}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleTouchEnd}
                aria-label="Seek"
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-indigo-400"
            />

            {/* Controls row */}
            <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white hover:bg-indigo-400 active:scale-95"
                >
                    {isPlaying ? (
                        /* Pause icon */
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                            aria-hidden="true"
                        >
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                    ) : (
                        /* Play icon */
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                            aria-hidden="true"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Time display */}
                <span className="font-mono text-xs text-white/70 tabular-nums">
                    {formatTime(currentTime)}
                    <span className="mx-1 text-white/30">/</span>
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    );
}
