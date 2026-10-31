'use client';

import { useState } from 'react';

import prose from '@/content/prose.json';

type QuestionId = 'psychosis' | 'dissociation' | 'epilepsy' | 'ptsd' | 'trauma' | 'personality';

// The JSON widens `id` to string; the screening test checks the ids match QuestionId.
const QUESTIONS = prose.screening.questions as readonly {
    id: QuestionId;
    text: string;
    explanation: string;
}[];
type Answer = 'yes' | 'no';
type Answers = Partial<Record<QuestionId, Answer>>;

interface ContraindicationFormProps {
    onNext: (answers: Record<QuestionId, Answer>) => void;
}

export function ContraindicationForm({ onNext }: ContraindicationFormProps) {
    const [answers, setAnswers] = useState<Answers>({});

    const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);

    function handleAnswer(id: QuestionId, value: Answer) {
        setAnswers(prev => ({ ...prev, [id]: value }));
    }

    function handleSubmit() {
        if (!allAnswered) return;
        onNext(answers as Record<QuestionId, Answer>);
    }

    return (
        <div className="flex flex-col gap-6 px-6 py-8">
            <div data-speech-clip="prose/screening-intro">
                <h1 className="text-2xl font-bold text-gray-900">{prose.screening.heading}</h1>
                <p className="mt-2 text-base text-gray-600">{prose.screening.intro}</p>
            </div>

            <ol className="flex flex-col gap-4">
                {QUESTIONS.map((q, index) => (
                    <li
                        key={q.id}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                        data-speech-clip={`prose/screening-question-${index}`}
                    >
                        <p className="text-sm font-medium text-gray-800">
                            <span className="mr-2 text-indigo-500">{index + 1}.</span>
                            {q.text}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{q.explanation}</p>
                        <div className="mt-3 flex gap-3">
                            <button
                                onClick={() => handleAnswer(q.id, 'yes')}
                                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                                    answers[q.id] === 'yes'
                                        ? 'bg-red-100 text-red-700 ring-2 ring-red-400'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => handleAnswer(q.id, 'no')}
                                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                                    answers[q.id] === 'no'
                                        ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                No
                            </button>
                        </div>
                    </li>
                ))}
            </ol>

            <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
                {allAnswered ? 'Continue' : `Answer all questions to continue`}
            </button>
        </div>
    );
}
