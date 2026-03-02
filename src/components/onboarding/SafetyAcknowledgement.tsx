'use client';

import { useState } from 'react';

interface SafetyAcknowledgementProps {
    onComplete: () => void;
}

export function SafetyAcknowledgement({ onComplete }: SafetyAcknowledgementProps) {
    const [acknowledged, setAcknowledged] = useState(false);

    return (
        <div className="flex flex-col gap-6 px-6 py-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">One Last Step</h1>
                <p className="mt-2 text-base text-gray-600">
                    Please read and acknowledge the following before using the app.
                </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-900">Important Notice</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-amber-800">
                    <li>
                        • Self-hypnosis is a <strong>complementary practice</strong> and does not
                        replace professional medical or psychological treatment.
                    </li>
                    <li>
                        • If you have a mental health condition, consult your healthcare provider
                        before starting.
                    </li>
                    <li>• You are always in control during a session and can stop at any time.</li>
                </ul>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={e => setAcknowledged(e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer accent-indigo-600"
                />
                <span className="text-sm text-gray-800">
                    I understand that self-hypnosis is complementary and does not replace
                    professional treatment.
                </span>
            </label>

            <button
                onClick={onComplete}
                disabled={!acknowledged}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
                Complete Setup
            </button>
        </div>
    );
}
