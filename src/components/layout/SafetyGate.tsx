'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { db } from '@lib/db';
import { Logger } from '@utils/logger';

interface SafetyGateProps {
    children: React.ReactNode;
}

export function SafetyGate({ children }: SafetyGateProps) {
    const router = useRouter();

    const settings = useLiveQuery(() => db.settings.get('user'));
    const isLoading = settings === undefined;

    useEffect(() => {
        if (isLoading) return;
        if (!settings?.onboardingComplete) {
            Logger.info('SafetyGate: onboarding incomplete, redirecting');
            router.replace('/onboarding');
        }
    }, [isLoading, settings?.onboardingComplete, router]);

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
