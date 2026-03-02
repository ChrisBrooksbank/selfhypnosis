import { useLiveQuery } from '@hooks/useDexieQuery';

import { db } from '@lib/db';

export interface OnboardingStatus {
    isComplete: boolean;
    hasContraindication: boolean;
    riskLevel: 'none' | 'amber' | 'red';
}

export function useOnboardingStatus(): OnboardingStatus {
    const settings = useLiveQuery(() => db.settings.get('user'));

    return {
        isComplete: settings?.onboardingComplete ?? false,
        hasContraindication: settings?.hasContraindication ?? false,
        riskLevel: settings?.riskLevel ?? 'none',
    };
}
