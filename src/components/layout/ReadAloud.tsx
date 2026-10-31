'use client';

/**
 * ReadAloud — a floating Listen button on every page (except the full-screen session
 * player). Reads the page's text aloud: recorded narration where a block has a clip,
 * the device voice for everything else. Big touch targets, with pause and stop.
 */

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';

import { useNarrator } from '@hooks/useNarrator';
import { narrator } from '@lib/speech/narrator';
import { collectNarrationItems } from '@lib/speech/pageText';

function subscribeFullscreen(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-fullscreen'],
    });
    return () => observer.disconnect();
}

const isFullscreen = () => document.documentElement.hasAttribute('data-fullscreen');

const ICON_CLASS = 'h-6 w-6';

function SpeakerIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
            <path d="M3 10v4h4l5 4V6L7 10H3z" />
            <path
                d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </svg>
    );
}

function PauseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
    );
}

function PlayIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function StopIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
    );
}

export function ReadAloud() {
    const { status } = useNarrator();
    const pathname = usePathname();
    const fullscreen = useSyncExternalStore(subscribeFullscreen, isFullscreen, () => false);

    // Stop reading when the page changes.
    useEffect(() => {
        narrator.stop();
    }, [pathname]);

    if (fullscreen) return null;

    function handleMain() {
        if (status === 'idle') narrator.start(collectNarrationItems());
        else if (status === 'playing') narrator.pause();
        else narrator.resume();
    }

    const label =
        status === 'idle'
            ? 'Listen to this page'
            : status === 'playing'
              ? 'Pause listening'
              : 'Resume listening';

    return (
        <div data-no-speech className="fixed right-4 bottom-24 z-30 flex items-center gap-2">
            {status !== 'idle' && (
                <button
                    onClick={() => narrator.stop()}
                    aria-label="Stop listening"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-gray-200 hover:bg-gray-50 active:scale-95"
                >
                    <StopIcon />
                </button>
            )}
            <button
                onClick={handleMain}
                aria-label={label}
                title={label}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 active:scale-95"
            >
                {status === 'idle' ? (
                    <SpeakerIcon />
                ) : status === 'playing' ? (
                    <PauseIcon />
                ) : (
                    <PlayIcon />
                )}
            </button>
        </div>
    );
}
