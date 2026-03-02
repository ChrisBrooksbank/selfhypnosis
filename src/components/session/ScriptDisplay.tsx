'use client';

/**
 * ScriptDisplay — typewriter reveal of a script segment.
 *
 * - Reveals text character-by-character at ~40 chars/second.
 * - After 8 seconds, fades the container to low opacity so the user can close their eyes.
 * - Resets fully when `segmentIndex` changes.
 */

import { useEffect, useRef, useState } from 'react';

export interface ScriptDisplayProps {
    /** The full text of the current script segment. */
    text: string;
    /** Segment index — changing this value resets the typewriter and fade timer. */
    segmentIndex: number;
    /** Characters revealed per second. Defaults to 40. */
    charsPerSecond?: number;
}

const FADE_DELAY_MS = 8_000;
const TICK_MS = 40; // ~25 fps, smooth enough for character reveal
const DEFAULT_CPS = 40;

export function ScriptDisplay({
    text,
    segmentIndex,
    charsPerSecond = DEFAULT_CPS,
}: ScriptDisplayProps) {
    const [revealedCount, setRevealedCount] = useState(0);
    const [faded, setFaded] = useState(false);

    const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset when segment changes
    useEffect(() => {
        // Clear existing timers
        if (typewriterRef.current !== null) {
            clearInterval(typewriterRef.current);
            typewriterRef.current = null;
        }
        if (fadeTimerRef.current !== null) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
        }

        setRevealedCount(0);
        setFaded(false);

        if (!text) return;

        // Characters revealed per tick
        const charsPerTick = Math.max(1, Math.round((charsPerSecond * TICK_MS) / 1000));

        typewriterRef.current = setInterval(() => {
            setRevealedCount(prev => {
                const next = prev + charsPerTick;
                if (next >= text.length) {
                    if (typewriterRef.current !== null) {
                        clearInterval(typewriterRef.current);
                        typewriterRef.current = null;
                    }
                    return text.length;
                }
                return next;
            });
        }, TICK_MS);

        // Fade after 8 seconds
        fadeTimerRef.current = setTimeout(() => {
            setFaded(true);
        }, FADE_DELAY_MS);

        return () => {
            if (typewriterRef.current !== null) {
                clearInterval(typewriterRef.current);
                typewriterRef.current = null;
            }
            if (fadeTimerRef.current !== null) {
                clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segmentIndex, text]);

    const visibleText = text.slice(0, revealedCount);

    return (
        <div
            className={`transition-opacity duration-2000 ${faded ? 'opacity-20' : 'opacity-100'}`}
            aria-live="polite"
            aria-atomic="false"
        >
            <p className="text-center text-xl leading-relaxed tracking-wide text-white">
                {visibleText}
                {revealedCount < text.length && <span className="animate-pulse opacity-70">▌</span>}
            </p>
        </div>
    );
}
