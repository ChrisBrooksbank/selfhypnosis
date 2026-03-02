'use client';

import { StreakCounter } from '@components/dashboard/StreakCounter';
import { LastSessionCard } from '@components/dashboard/LastSessionCard';
import { Recommendations } from '@components/dashboard/Recommendations';
import { QuickLauncher } from '@components/dashboard/QuickLauncher';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Home() {
    return (
        <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome to your self-hypnosis practice.
                </p>
            </div>

            <StreakCounter />

            <section>
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Last Session
                </h2>
                <LastSessionCard />
            </section>

            <Recommendations />

            <QuickLauncher />
        </main>
    );
}
