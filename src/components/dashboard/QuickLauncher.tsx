'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@lib/db';

function formatSessionName(templateId?: string): string {
    if (!templateId) return 'Custom Session';
    return templateId
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export function QuickLauncher() {
    const lastSession = useLiveQuery(async () => {
        const completed = await db.sessions
            .where('completedAt')
            .notEqual('')
            .reverse()
            .sortBy('completedAt');
        return completed[0] ?? null;
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <Link
                href="/session"
                className="flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-4 text-center text-lg font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-95"
            >
                Start Session
            </Link>

            {lastSession != null && lastSession.templateId && (
                <Link
                    href="/session"
                    className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-100"
                >
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-indigo-500">Repeat last session</p>
                        <p className="truncate text-sm font-semibold text-indigo-800">
                            {formatSessionName(lastSession.templateId)}
                        </p>
                    </div>
                    <svg
                        className="ml-2 h-4 w-4 shrink-0 text-indigo-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            )}
        </div>
    );
}
