import { describe, expect, it } from 'vitest';

import { validateSuggestion } from './validator';

const ratings = { believable: true, emotionallyEngaging: true };

describe('validateSuggestion', () => {
    it('scores a well-formed suggestion 5/5', () => {
        const { score } = validateSuggestion('I am calm and centred today', ratings);
        expect(score).toBe(5);
    });

    it.each(["I don't feel anxious", 'I don’t feel anxious', 'I can’t be stopped now'])(
        'flags negation in %j',
        text => {
            expect(validateSuggestion(text, ratings).criteria.positiveFraming).toBe(false);
        }
    );

    it.each(['I will be calm tomorrow', 'I’ll feel calm and relaxed', "I'll feel calm"])(
        'flags future tense in %j',
        text => {
            expect(validateSuggestion(text, ratings).criteria.presentTense).toBe(false);
        }
    );

    it('does not flag words that merely contain negations', () => {
        const { criteria } = validateSuggestion('I am unstoppable and know my worth', ratings);
        expect(criteria.positiveFraming).toBe(true);
        expect(criteria.presentTense).toBe(true);
    });
});
