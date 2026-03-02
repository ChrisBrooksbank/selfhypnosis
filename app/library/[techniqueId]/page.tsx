import type { TechniqueId } from '@/types';

const techniqueIds: TechniqueId[] = [
    'eye-fixation',
    'pmr',
    'visualisation',
    'countdown',
    'breathing',
    '321-sensory',
    'autogenic',
];

export function generateStaticParams() {
    return techniqueIds.map(id => ({ techniqueId: id }));
}

interface Props {
    params: Promise<{ techniqueId: string }>;
}

export default async function TechniqueDetailPage({ params }: Props) {
    const { techniqueId } = await params;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6">
            <h1 className="mb-4 text-2xl font-bold text-indigo-900">Technique Detail</h1>
            <p className="text-center text-gray-600">{techniqueId} — coming soon.</p>
        </main>
    );
}
