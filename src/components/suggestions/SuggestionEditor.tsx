'use client';

import { useEffect, useRef, useState } from 'react';

import type { GoalArea } from '@/types';

interface SpeechRecognitionResult {
    readonly 0: { readonly transcript: string };
}

interface SpeechRecognitionResultList {
    readonly 0: SpeechRecognitionResult;
}

interface SpeechRecognitionEvt extends Event {
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvt) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SuggestionEditorProps {
    goalArea: GoalArea;
    value: string;
    onChange: (text: string) => void;
}

const exampleChips: Record<GoalArea, string[]> = {
    'stress-anxiety': ['I am calm and centered', 'My mind is clear and peaceful'],
    pain: ['My body is comfortable and at ease', 'I manage sensation with confidence'],
    sleep: ['I drift into deep, restful sleep', 'My mind quiets naturally at bedtime'],
    habits: ['I choose healthy patterns naturally', 'I am in control of my choices'],
    performance: ['I am confident and prepared', 'I perform at my best with ease'],
    ibs: ['My digestive system functions calmly', 'I feel comfortable and at ease'],
    childbirth: ['My body knows how to birth naturally', 'Each surge brings my baby closer'],
    'general-relaxation': ['I am deeply relaxed and at peace', 'Calm flows through my entire body'],
};

export function SuggestionEditor({ goalArea, value, onChange }: SuggestionEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    useEffect(() => {
        const supported =
            typeof window !== 'undefined' &&
            ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
        setSpeechSupported(supported);
    }, []);

    const handleChipClick = (chip: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            onChange(chip);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = value.slice(0, start);
        const after = value.slice(end);
        const separator = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
        const newValue = before + separator + chip + after;
        onChange(newValue);

        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = (before + separator + chip).length;
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const toggleVoiceInput = () => {
        if (!speechSupported) return;

        const win = window as Window & {
            SpeechRecognition?: SpeechRecognitionConstructor;
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
        };
        const SpeechRecognitionAPI = win.SpeechRecognition ?? win.webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvt) => {
            const transcript = event.results[0]?.[0]?.transcript ?? '';
            if (transcript) {
                const trimmed = value.trimEnd();
                const separator = trimmed.length > 0 ? ' ' : '';
                onChange(trimmed + separator + transcript);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const chips = exampleChips[goalArea];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="mb-2 text-sm font-medium text-gray-600">
                    Example phrases — tap to insert:
                </p>
                <div className="flex flex-wrap gap-2">
                    {chips.map(chip => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => handleChipClick(chip)}
                            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 transition-colors hover:bg-indigo-100 active:bg-indigo-200"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Write your suggestion here… e.g. I am calm and at ease"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
                {speechSupported && (
                    <button
                        type="button"
                        onClick={toggleVoiceInput}
                        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                        className={`absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            isListening
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {isListening ? (
                            <span className="text-base">⏹</span>
                        ) : (
                            <span className="text-base">🎤</span>
                        )}
                    </button>
                )}
            </div>

            {isListening && (
                <p className="text-sm text-red-600" role="status">
                    Listening… speak your suggestion now.
                </p>
            )}
        </div>
    );
}
