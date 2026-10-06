'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { db, type UserSettings } from '@lib/db';
import { Logger } from '@utils/logger';

interface SafetyGateProps {
    children: React.ReactNode;
}

export function SafetyGate({ children }: SafetyGateProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [settings, setSettings] = useState<UserSettings | null | undefined>(undefined);
    // Settings are re-read on every navigation (e.g. right after onboarding saves them).
    // Until the read for the current path finishes, stale "not onboarded" state must not
    // trigger a redirect back to onboarding.
    const [loadedPath, setLoadedPath] = useState<string | null>(null);
    const isLoading =
        settings === undefined || (loadedPath !== pathname && !settings?.onboardingComplete);
    const isOnboarding = pathname.startsWith('/onboarding');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const result = await db.settings.get('user');
                if (!cancelled) {
                    setSettings(result ?? null);
                    setLoadedPath(pathname);
                }
            } catch (err) {
                Logger.error('SafetyGate: failed to load settings', err);
                if (!cancelled) {
                    setSettings(null);
                    setLoadedPath(pathname);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [pathname]);

    useEffect(() => {
        if (isLoading || isOnboarding) return;
        if (!settings?.onboardingComplete) {
            Logger.info('SafetyGate: onboarding incomplete, redirecting');
            router.replace('/onboarding');
        }
    }, [isLoading, isOnboarding, settings?.onboardingComplete, router]);

    if (isOnboarding) {
        return <>{children}</>;
    }

    if (isLoading) {
        return null;
    }

    if (!settings?.onboardingComplete) {
        return null;
    }

    const riskLevel = settings.riskLevel;

    return (
        <>
            {riskLevel === 'amber' && (
                <div
                    role="alert"
                    className="sticky top-0 z-40 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800"
                >
                    Some of your answers suggest extra care is recommended. Continue with awareness.
                </div>
            )}
            {riskLevel === 'red' && (
                <div
                    role="alert"
                    className="sticky top-0 z-40 bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-800"
                >
                    Based on your screening, session launch is disabled. The technique library is
                    still available.
                </div>
            )}
            {children}
        </>
    );
}
