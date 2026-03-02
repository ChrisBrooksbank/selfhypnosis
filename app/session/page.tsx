'use client';

import { useState } from 'react';

import type { GuidedSession } from '@/types';
import { PageHeader } from '@components/layout/PageHeader';
import { SessionLauncher } from '@components/session/SessionLauncher';
import { TimerMode } from '@components/session/TimerMode';

import beginnerRelaxation from '@/content/sessions/beginner-relaxation.json';
import stressRelief from '@/content/sessions/stress-relief.json';
import sleepPreparation from '@/content/sessions/sleep-preparation.json';

const sessions: GuidedSession[] = [
    beginnerRelaxation,
    stressRelief,
    sleepPreparation,
] as GuidedSession[];

type Tab = 'guided' | 'timer';

export default function SessionPage() {
    const [activeTab, setActiveTab] = useState<Tab>('guided');

    return (
        <main className="flex flex-col gap-6 p-4">
            <PageHeader title="Start a Session" />

            {/* Tab switcher */}
            <div className="flex rounded-xl bg-gray-100 p-1">
                <button
                    onClick={() => setActiveTab('guided')}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                        activeTab === 'guided'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Guided Sessions
                </button>
                <button
                    onClick={() => setActiveTab('timer')}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                        activeTab === 'timer'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Free Timer
                </button>
            </div>

            {activeTab === 'guided' ? <SessionLauncher sessions={sessions} /> : <TimerMode />}
        </main>
    );
}
