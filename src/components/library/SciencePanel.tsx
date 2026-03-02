import type { Technique } from '@/types';

interface SciencePanelProps {
    technique: Technique;
}

export function SciencePanel({ technique }: SciencePanelProps) {
    return (
        <div className="flex flex-col gap-6">
            <p className="text-sm leading-relaxed text-gray-700">{technique.scienceBlurb}</p>
            {technique.citations.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">References</h3>
                    <ol className="flex flex-col gap-2">
                        {technique.citations.map((citation, index) => (
                            <li key={index} className="flex gap-2 text-sm text-gray-600">
                                <span className="shrink-0 font-medium text-indigo-600">
                                    [{index + 1}]
                                </span>
                                <span>{citation}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
