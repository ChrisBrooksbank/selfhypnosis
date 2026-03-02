'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ContraindicationForm } from '@components/onboarding/ContraindicationForm';
import { SafetyAcknowledgement } from '@components/onboarding/SafetyAcknowledgement';
import { WelcomeSlide } from '@components/onboarding/WelcomeSlide';
import { db } from '@lib/db';
import { Logger } from '@utils/logger';

type Step = 0 | 1 | 2;

type ContraindicationAnswers = Record<
    'psychosis' | 'dissociation' | 'epilepsy' | 'ptsd' | 'trauma' | 'personality',
    'yes' | 'no'
>;

function computeRiskLevel(answers: boolean[]): 'none' | 'amber' | 'red' {
    const yesCount = answers.filter(Boolean).length;
    if (yesCount === 0) return 'none';
    if (yesCount <= 2) return 'amber';
    return 'red';
}

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(0);
    const [contraindicationAnswers, setContraindicationAnswers] =
        useState<ContraindicationAnswers | null>(null);

    function handleWelcomeNext() {
        setStep(1);
    }

    function handleFormNext(answers: ContraindicationAnswers) {
        setContraindicationAnswers(answers);
        setStep(2);
    }

    async function handleComplete() {
        const questionOrder = [
            'psychosis',
            'dissociation',
            'epilepsy',
            'ptsd',
            'trauma',
            'personality',
        ] as const;

        const booleanAnswers = questionOrder.map(id => contraindicationAnswers?.[id] === 'yes');
        const hasContraindication = booleanAnswers.some(Boolean);
        const riskLevel = computeRiskLevel(booleanAnswers);

        try {
            await db.settings.put({
                id: 'user',
                onboardingComplete: true,
                safetyAcknowledgedAt: new Date().toISOString(),
                contraindicationAnswers: booleanAnswers,
                hasContraindication,
                riskLevel,
                notificationsEnabled: false,
                defaultSessionDuration: 20,
                preferredTechniques: [],
                theme: 'system',
            });

            Logger.info('Onboarding complete, riskLevel:', riskLevel);
            router.replace('/');
        } catch (err) {
            Logger.error('Failed to save onboarding settings:', err);
        }
    }

    return (
        <main className="mx-auto min-h-screen max-w-lg overflow-y-auto">
            <div className="mx-auto flex justify-center gap-2 pt-6 pb-2">
                {([0, 1, 2] as Step[]).map(s => (
                    <span
                        key={s}
                        className={`h-2 rounded-full transition-all ${
                            s === step ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-300'
                        }`}
                        aria-hidden="true"
                    />
                ))}
            </div>

            {step === 0 && <WelcomeSlide onNext={handleWelcomeNext} />}
            {step === 1 && <ContraindicationForm onNext={handleFormNext} />}
            {step === 2 && <SafetyAcknowledgement onComplete={handleComplete} />}
        </main>
    );
}
