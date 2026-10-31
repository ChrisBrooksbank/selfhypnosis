'use client';

import prose from '@/content/prose.json';

interface WelcomeSlideProps {
    onNext: () => void;
}

const { welcome } = prose;

export function WelcomeSlide({ onNext }: WelcomeSlideProps) {
    return (
        <div className="flex flex-col gap-8 px-6 py-8">
            <div className="text-center" data-speech-clip="prose/welcome-intro">
                <div className="mb-4 text-5xl" aria-hidden="true">
                    🧘
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{welcome.heading}</h1>
                <p className="mt-3 text-base text-gray-600">{welcome.intro}</p>
            </div>

            <div>
                <h2
                    className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase"
                    data-speech-clip="prose/welcome-myths-heading"
                >
                    {welcome.mythsHeading}
                </h2>
                <ul className="flex flex-col gap-3">
                    {welcome.myths.map(({ myth, truth }, i) => (
                        <li
                            key={myth}
                            className="flex gap-3 rounded-xl bg-indigo-50 p-4"
                            data-speech-clip={`prose/welcome-myth-${i}`}
                        >
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
