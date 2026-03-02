'use client';

import { useState } from 'react';

import { SciencePanel } from '@components/library/SciencePanel';
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
            <p className="text-sm leading-relaxed text-gray-700">{technique.overview}</p>
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-900">Steps</h3>
                <ol className="flex flex-col gap-4">
                    {technique.steps.map(step => (
                        <li key={step.number} className="flex gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
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
    const steps = technique.steps;
    const isLast = currentStep === steps.length - 1;
    const step = steps[currentStep];

    function handleNext() {
        if (!isLast) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCurrentStep(0);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
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

            <div className="min-h-32 rounded-xl bg-indigo-50 p-5">
                <p className="text-base leading-relaxed text-gray-800">{step?.instruction}</p>
                {step?.duration && <p className="mt-2 text-sm text-indigo-500">{step.duration}</p>}
            </div>

            <button
                onClick={handleNext}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
            >
                {isLast ? 'Start Again' : 'Next'}
            </button>
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
