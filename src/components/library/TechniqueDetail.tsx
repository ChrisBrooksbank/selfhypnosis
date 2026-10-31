'use client';

import { useEffect, useState } from 'react';

import { SciencePanel } from '@components/library/SciencePanel';
import { useNarrator } from '@hooks/useNarrator';
import { contentClip } from '@lib/speech/contentAudio';
import { narrator, type NarrationItem } from '@lib/speech/narrator';
import { stepGapMs } from '@lib/speech/pacing';
import type { Technique } from '@/types';

interface TechniqueDetailProps {
    technique: Technique;
}

type TabId = 'how-it-works' | 'the-science' | 'try-it';

const tabs: { id: TabId; label: string }[] = [
    { id: 'how-it-works', label: 'How it Works' },
    { id: 'the-science', label: 'The Science' },
    { id: 'try-it', label: 'Try It' },
];

function HowItWorksTab({ technique }: { technique: Technique }) {
    return (
        <div className="flex flex-col gap-6">
            <p
                className="text-sm leading-relaxed text-gray-700"
                data-speech-clip={`technique/${technique.id}/overview`}
            >
                {technique.overview}
            </p>
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-900" data-no-speech>
                    Steps
                </h3>
                <ol className="flex flex-col gap-4">
                    {technique.steps.map(step => (
                        <li
                            key={step.number}
                            className="flex gap-3"
                            data-speech-clip={`technique/${technique.id}/step-${step.number}`}
                        >
                            <span
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
                                aria-hidden="true"
                            >
                                {step.number}
                            </span>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm text-gray-700">{step.instruction}</p>
                                {step.duration && (
                                    <p className="text-xs text-gray-400">{step.duration}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function TryItTab({ technique }: { technique: Technique }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [guided, setGuided] = useState(false);
    const { status } = useNarrator();
    const steps = technique.steps;
    const isLast = currentStep === steps.length - 1;
    const step = steps[currentStep];
    const guidedActive = guided && status !== 'idle';

    // Leaving the tab (or page) must not leave a narration running.
    useEffect(() => {
        return () => narrator.stop();
    }, []);

    function handleNext() {
        if (!isLast) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCurrentStep(0);
        }
    }

    // Hands-free practice: each step is spoken, then followed by silence for its duration.
    function startGuided() {
        const items: NarrationItem[] = steps.map(s => ({
            text: s.instruction,
            clip: contentClip(`technique/${technique.id}/step-${s.number}`),
            afterMs: stepGapMs(s.duration),
        }));
        setCurrentStep(0);
        setGuided(true);
        narrator.start(items, {
            onItemStart: setCurrentStep,
            onDone: () => setGuided(false),
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between" data-no-speech>
                <p className="text-xs text-gray-400">
                    Step {currentStep + 1} of {steps.length}
                </p>
                <div className="flex gap-1">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 w-4 rounded-full ${
                                i === currentStep
                                    ? 'bg-indigo-500'
                                    : i < currentStep
                                      ? 'bg-indigo-200'
                                      : 'bg-gray-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div
                className="min-h-32 rounded-xl bg-indigo-50 p-5"
                data-speech-clip={`technique/${technique.id}/step-${step?.number ?? 1}`}
            >
                <p className="text-base leading-relaxed text-gray-800">{step?.instruction}</p>
                {step?.duration && <p className="mt-2 text-sm text-indigo-500">{step.duration}</p>}
            </div>

            {guidedActive ? (
                <div className="flex gap-3" data-no-speech>
                    <button
                        onClick={() =>
                            status === 'playing' ? narrator.pause() : narrator.resume()
                        }
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-5 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                        {status === 'playing' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                        onClick={() => {
                            narrator.stop();
                            setGuided(false);
                        }}
                        className="rounded-xl bg-gray-100 px-6 py-5 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        Stop
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3" data-no-speech>
                    <button
                        onClick={startGuided}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                    >
                        Start guided practice (spoken)
                    </button>
                    <button
                        onClick={handleNext}
                        className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                    >
                        {isLast ? 'Start Again' : 'Next'}
                    </button>
                </div>
            )}
        </div>
    );
}

export function TechniqueDetail({ technique }: TechniqueDetailProps) {
    const [activeTab, setActiveTab] = useState<TabId>('how-it-works');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex rounded-xl bg-gray-100 p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="pt-2">
                {activeTab === 'how-it-works' && <HowItWorksTab technique={technique} />}
                {activeTab === 'the-science' && <SciencePanel technique={technique} />}
                {activeTab === 'try-it' && <TryItTab technique={technique} />}
            </div>
        </div>
    );
}
