'use client';

import { StreakCounter } from '@components/dashboard/StreakCounter';
import { LastSessionCard } from '@components/dashboard/LastSessionCard';
import { Recommendations } from '@components/dashboard/Recommendations';
import { QuickLauncher } from '@components/dashboard/QuickLauncher';
import { Lull } from '@components/art/Lull';
import { Sky } from '@components/art/Sky';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Home() {
    return (
        <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
            <div className="relative -mx-4 -mt-6 overflow-hidden rounded-b-3xl bg-gradient-to-b from-[#120f33] via-[#2a2070] to-[#5a46b8] px-6 pt-8 pb-6 text-white shadow-lg">
                <Sky />
                <div className="relative flex items-center justify-between gap-2">
                    <div>
                        <p className="text-xs tracking-[0.28em] text-indigo-200 uppercase">
                            Self-Hypnosis
                        </p>
                        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
                            {getGreeting()}
                        </h1>
                        <p className="font-display mt-1 text-base text-indigo-100 italic">
                            Somewhere quieter is ten minutes away.
                        </p>
                    </div>
                    <Lull size={116} mood="calm" className="-mr-2 shrink-0" />
                </div>
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
