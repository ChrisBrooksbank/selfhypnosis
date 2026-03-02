'use client';

import Link from 'next/link';
import { useLiveQuery } from '@hooks/useDexieQuery';

import { db } from '@lib/db';

interface RecommendationCard {
    id: string;
    title: string;
    body: string;
    actionLabel: string;
    actionHref: string;
}

function buildRecommendations(
    totalSessions: number,
    hasBeginnerSession: boolean,
    hasUsedBuilder: boolean,
    avgDepth: number | null,
    hasConsistentPractice: boolean,
    usedTemplateIds: Set<string>
): RecommendationCard[] {
    const cards: RecommendationCard[] = [];

    // Rule 1 — New user (0-2 completed sessions)
    if (totalSessions <= 2) {
        cards.push({
            id: 'new-user',
            title: 'Start with Beginner Relaxation',
            body: "You're just getting started. The Beginner Relaxation session is a gentle introduction to self-hypnosis.",
            actionLabel: 'Begin session',
            actionHref: '/session',
        });
    }

    // Rule 2 — Has beginner sessions, suggest variety
    if (
        totalSessions > 2 &&
        hasBeginnerSession &&
        !usedTemplateIds.has('stress-relief') &&
        !usedTemplateIds.has('sleep-preparation')
    ) {
        cards.push({
            id: 'try-variety',
            title: 'Explore a new session type',
            body: "You've completed beginner sessions. Try a different goal area to broaden your practice.",
            actionLabel: 'Browse sessions',
            actionHref: '/session',
        });
    }

    // Rule 3 — Hasn't tried suggestion builder
    if (!hasUsedBuilder) {
        cards.push({
            id: 'try-builder',
            title: 'Create your own suggestions',
            body: 'Personalised suggestions can make sessions more effective. Try the suggestion builder to craft your own.',
            actionLabel: 'Open builder',
            actionHref: '/suggestions/builder',
        });
    }

    // Rule 4 — Low depth ratings (average below 3 and at least 2 sessions rated)
    if (avgDepth !== null && avgDepth < 3) {
        cards.push({
            id: 'low-depth',
            title: 'Try a different induction technique',
            body: 'Your recent depth ratings suggest the current approach may not be the best fit. Browse the library for alternative induction methods.',
            actionLabel: 'View techniques',
            actionHref: '/library',
        });
    }

    // Rule 5 — Consistent practice (5+ sessions), encourage advancing
    if (hasConsistentPractice && totalSessions >= 5) {
        cards.push({
            id: 'advance',
            title: 'Ready to go deeper?',
            body: "You're building a consistent practice. Consider exploring intermediate sessions and advanced techniques in the library.",
            actionLabel: 'Explore library',
            actionHref: '/library',
        });
    }

    // Return at most 3 cards
    return cards.slice(0, 3);
}

export function Recommendations() {
    const data = useLiveQuery(async () => {
        const [allSessions, suggestions] = await Promise.all([
            db.sessions.where('completedAt').notEqual('').toArray(),
            db.suggestions.count(),
        ]);

        const completed = allSessions.filter(s => s.completedAt != null);
        const totalSessions = completed.length;

        const hasBeginnerSession = completed.some(s => s.templateId === 'beginner-relaxation');

        const hasUsedBuilder = suggestions > 0;

        const rated = completed.filter(s => s.depthRating != null);
        const avgDepth =
            rated.length >= 2
                ? rated.reduce((sum, s) => sum + (s.depthRating ?? 0), 0) / rated.length
                : null;

        // Consistent practice: 3+ sessions in the last 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentCount = completed.filter(
            s => new Date(s.completedAt!).getTime() >= sevenDaysAgo
        ).length;
        const hasConsistentPractice = recentCount >= 3;

        const usedTemplateIds = new Set(
            completed.map(s => s.templateId).filter((id): id is string => id != null)
        );

        return {
            totalSessions,
            hasBeginnerSession,
            hasUsedBuilder,
            avgDepth,
            hasConsistentPractice,
            usedTemplateIds,
        };
    }, []);

    if (data === undefined) {
        return (
            <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    const cards = buildRecommendations(
        data.totalSessions,
        data.hasBeginnerSession,
        data.hasUsedBuilder,
        data.avgDepth,
        data.hasConsistentPractice,
        data.usedTemplateIds
    );

    if (cards.length === 0) return null;

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Recommended for you
            </h2>
            {cards.map(card => (
                <div
                    key={card.id}
                    className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm"
                >
                    <p className="font-semibold text-indigo-900">{card.title}</p>
                    <p className="mt-1 text-sm text-indigo-700">{card.body}</p>
                    <Link
                        href={card.actionHref}
                        className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                        {card.actionLabel}
                    </Link>
                </div>
            ))}
        </div>
    );
}
