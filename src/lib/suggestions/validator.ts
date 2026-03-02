export interface ValidationCriteria {
    positiveFraming: boolean;
    presentTense: boolean;
    specific: boolean;
    believable: boolean;
    emotionallyEngaging: boolean;
}

export interface ValidationResult {
    criteria: ValidationCriteria;
    score: number;
}

const NEGATION_REGEX = /\b(not|don't|dont|won't|wont|can't|cant|never|no\b|stop|avoid|without)\b/i;
const FUTURE_TENSE_REGEX = /\b(will\b|going to|shall\b|will be)\b/i;

export function validateSuggestion(
    text: string,
    userRatings: Pick<ValidationCriteria, 'believable' | 'emotionallyEngaging'>
): ValidationResult {
    const words = text.trim().split(/\s+/).filter(Boolean);

    const positiveFraming = !NEGATION_REGEX.test(text);
    const presentTense = !FUTURE_TENSE_REGEX.test(text);
    const specific = words.length >= 4;

    const criteria: ValidationCriteria = {
        positiveFraming,
        presentTense,
        specific,
        believable: userRatings.believable,
        emotionallyEngaging: userRatings.emotionallyEngaging,
    };

    const score = Object.values(criteria).filter(Boolean).length;

    return { criteria, score };
}
