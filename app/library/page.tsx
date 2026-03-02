import type { Technique } from '@/types';
import { LibraryFilters } from '@components/library/LibraryFilters';
import { PageHeader } from '@components/layout/PageHeader';

import eyeFixation from '@/content/techniques/eye-fixation.json';
import pmr from '@/content/techniques/pmr.json';
import visualisation from '@/content/techniques/visualisation.json';
import countdown from '@/content/techniques/countdown.json';
import breathing from '@/content/techniques/breathing.json';
import sensory321 from '@/content/techniques/321-sensory.json';
import autogenic from '@/content/techniques/autogenic.json';

const techniques: Technique[] = [
    eyeFixation,
    pmr,
    visualisation,
    countdown,
    breathing,
    sensory321,
    autogenic,
] as Technique[];

export default function LibraryPage() {
    return (
        <main className="flex flex-col gap-6 p-4">
            <PageHeader title="Technique Library" />
            <LibraryFilters techniques={techniques} />
        </main>
    );
}
