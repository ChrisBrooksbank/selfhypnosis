'use client';

import { useState } from 'react';

const QUESTIONS = [
    {
        id: 'psychosis',
        text: 'Do you have active psychosis or schizophrenia?',
        explanation:
            'Hypnotic induction can intensify altered perceptions and is not recommended during active psychotic episodes.',
    },
    {
        id: 'dissociation',
        text: 'Do you have a severe dissociative disorder?',
        explanation:
            'Deep relaxation techniques may heighten dissociative experiences in those with severe dissociative conditions.',
    },
    {
        id: 'epilepsy',
        text: 'Do you have uncontrolled epilepsy?',
        explanation:
            'Certain relaxation or visualisation states may lower seizure threshold in some individuals with uncontrolled epilepsy.',
    },
    {
        id: 'ptsd',
        text: 'Do you have severe PTSD without current professional guidance?',
        explanation:
            'Self-hypnosis can surface traumatic memories. Professional support is strongly recommended before proceeding.',
    },
    {
        id: 'trauma',
        text: 'Have you experienced a significant traumatic event in the last 3 months?',
        explanation:
            'Recent trauma needs time to stabilise before working with inward-focused relaxation techniques.',
    },
    {
        id: 'personality',
        text: 'Do you have a personality disorder that affects your sense of reality?',
        explanation:
            'Conditions that impair reality testing may make it harder to maintain grounded awareness during sessions.',
    },
] as const;

type QuestionId = (typeof QUESTIONS)[number]['id'];
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Safety Screening</h1>
                <p className="mt-2 text-base text-gray-600">
                    Please answer all 6 questions honestly. Your answers help us provide appropriate
                    guidance.
                </p>
            </div>

            <ol className="flex flex-col gap-4">
                {QUESTIONS.map((q, index) => (
                    <li key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
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
