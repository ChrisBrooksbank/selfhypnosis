'use client';

interface WelcomeSlideProps {
    onNext: () => void;
}

const MYTHS = [
    {
        myth: 'Mind control',
        truth: 'You are always in full control and can end the session at any time.',
    },
    {
        myth: 'Sleep or unconsciousness',
        truth: 'You remain aware and alert throughout — it is a focused, wakeful state.',
    },
    {
        myth: 'Loss of memory',
        truth: 'You will remember everything that happens during your session.',
    },
    {
        myth: 'Only works on some people',
        truth: 'Most people can benefit with practice — responsiveness improves over time.',
    },
];

export function WelcomeSlide({ onNext }: WelcomeSlideProps) {
    return (
        <div className="flex flex-col gap-8 px-6 py-8">
            <div className="text-center">
                <div className="mb-4 text-5xl" aria-hidden="true">
                    🧘
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to Self-Hypnosis</h1>
                <p className="mt-3 text-base text-gray-600">
                    Self-hypnosis is a natural state of focused attention combined with deep
                    relaxation. You guide yourself using self-directed suggestions to support
                    positive change.
                </p>
            </div>

            <div>
                <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Common myths — busted
                </h2>
                <ul className="flex flex-col gap-3">
                    {MYTHS.map(({ myth, truth }) => (
                        <li key={myth} className="flex gap-3 rounded-xl bg-indigo-50 p-4">
                            <span className="mt-0.5 shrink-0 text-red-500" aria-hidden="true">
                                ✗
                            </span>
                            <div>
                                <p className="font-medium text-gray-800 line-through">{myth}</p>
                                <p className="mt-0.5 text-sm text-gray-600">{truth}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={onNext}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
            >
                Get Started
            </button>
        </div>
    );
}
