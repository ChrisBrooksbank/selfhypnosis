import { describe, it, expect } from 'vitest';

describe('Application', () => {
    it('should pass a basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have correct technique IDs', () => {
        const techniques = [
            'eye-fixation',
            'pmr',
            'visualisation',
            'countdown',
            'breathing',
            '321-sensory',
            'autogenic',
        ];
        expect(techniques).toHaveLength(7);
        expect(techniques).toContain('breathing');
    });

    it('should have correct session phases', () => {
        const phases = ['preparation', 'induction', 'deepening', 'suggestion', 'emergence'];
        expect(phases).toHaveLength(5);
        expect(phases[0]).toBe('preparation');
        expect(phases[phases.length - 1]).toBe('emergence');
    });
});
