import type { GuidedSession } from '@/types';
import { PageHeader } from '@components/layout/PageHeader';
import { SessionLauncher } from '@components/session/SessionLauncher';

import beginnerRelaxation from '@/content/sessions/beginner-relaxation.json';
import stressRelief from '@/content/sessions/stress-relief.json';
import sleepPreparation from '@/content/sessions/sleep-preparation.json';

const sessions: GuidedSession[] = [
    beginnerRelaxation,
    stressRelief,
    sleepPreparation,
] as GuidedSession[];

export default function SessionPage() {
    return (
        <main className="flex flex-col gap-6 p-4">
            <PageHeader title="Start a Session" />
            <SessionLauncher sessions={sessions} />
        </main>
    );
}
