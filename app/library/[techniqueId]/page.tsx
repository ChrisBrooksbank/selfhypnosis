import { notFound } from 'next/navigation';

import type { Technique, TechniqueId } from '@/types';
import { TechniqueDetail } from '@components/library/TechniqueDetail';
import { PageHeader } from '@components/layout/PageHeader';

import eyeFixation from '@/content/techniques/eye-fixation.json';
import pmr from '@/content/techniques/pmr.json';
import visualisation from '@/content/techniques/visualisation.json';
import countdown from '@/content/techniques/countdown.json';
import breathing from '@/content/techniques/breathing.json';
import sensory321 from '@/content/techniques/321-sensory.json';
import autogenic from '@/content/techniques/autogenic.json';

const techniqueIds: TechniqueId[] = [
    'eye-fixation',
    'pmr',
    'visualisation',
    'countdown',
    'breathing',
    '321-sensory',
    'autogenic',
];

const techniqueMap: Record<TechniqueId, Technique> = {
    'eye-fixation': eyeFixation as Technique,
    pmr: pmr as Technique,
    visualisation: visualisation as Technique,
    countdown: countdown as Technique,
    breathing: breathing as Technique,
    '321-sensory': sensory321 as Technique,
    autogenic: autogenic as Technique,
};

export function generateStaticParams() {
    return techniqueIds.map(id => ({ techniqueId: id }));
}

interface Props {
    params: Promise<{ techniqueId: string }>;
}

export default async function TechniqueDetailPage({ params }: Props) {
    const { techniqueId } = await params;
    const technique = techniqueMap[techniqueId as TechniqueId];

    if (!technique) {
        notFound();
    }

    return (
        <main className="flex flex-col">
            <PageHeader title={technique.name} showBack />
            <div className="p-4">
                <p className="mb-4 text-sm text-gray-500">{technique.tagline}</p>
                <TechniqueDetail technique={technique} />
            </div>
        </main>
    );
}
