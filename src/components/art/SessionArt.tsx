import { useId, type ReactNode } from 'react';

interface SessionArtProps {
    /** Session id; unknown ids get the default moonlit-ripples scene. */
    sessionId: string;
    className?: string;
}

interface Palette {
    top: string;
    bottom: string;
}

const PALETTES: Record<string, Palette> = {
    'beginner-relaxation': { top: '#1d2a6b', bottom: '#6a6bd6' },
    'stress-relief': { top: '#2b2563', bottom: '#d98aa8' },
    'sleep-preparation': { top: '#0f1240', bottom: '#4a4aa8' },
    'pain-management': { top: '#3a1f5e', bottom: '#f2a56b' },
    'confidence-building': { top: '#2a1e63', bottom: '#ffb36b' },
    'ibs-gut-calm': { top: '#12385a', bottom: '#4fb3a1' },
    'mindful-eating': { top: '#3b2160', bottom: '#f0a35e' },
    'smoke-free': { top: '#17356b', bottom: '#8fd0e8' },
    'hands-at-peace': { top: '#2a2468', bottom: '#c78ae0' },
    'embers-for-two': { top: '#2a0f3c', bottom: '#ff7a6b' },
};

const STARS: [number, number, number][] = [
    [14, 12, 0.9],
    [38, 22, 0.6],
    [62, 9, 0.8],
    [88, 18, 0.5],
    [118, 11, 0.9],
    [146, 24, 0.6],
    [26, 38, 0.5],
    [132, 40, 0.5],
    [100, 30, 0.6],
];

function Moon({ x, y, r }: { x: number; y: number; r: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r * 2.2} fill="#ffe7a8" opacity="0.14" />
            <circle cx={x} cy={y} r={r * 1.5} fill="#ffe7a8" opacity="0.2" />
            <circle cx={x} cy={y} r={r} fill="#fff1c9" />
        </g>
    );
}

function Scene({ id }: { id: string }): ReactNode {
    switch (id) {
        case 'stress-relief':
            return (
                <>
                    <Moon x={118} y={30} r={9} />
                    <path
                        d="M0 70 L30 44 L52 62 L86 36 L120 66 L150 50 L160 58 V100 H0Z"
                        fill="#3b2f7a"
                        opacity="0.8"
                    />
                    <path d="M0 80 L26 60 L56 76 L92 52 L132 78 L160 66 V100 H0Z" fill="#2a2160" />
                    <path d="M0 88 Q40 80 80 88 T160 86 V100 H0Z" fill="#fff" opacity="0.14" />
                </>
            );
        case 'sleep-preparation':
            return (
                <>
                    <path d="M96 20 a16 16 0 1 0 14 24 a13 13 0 1 1 -14 -24z" fill="#fff1c9" />
                    <g fill="#9a9ae6" opacity="0.55">
                        <ellipse cx="38" cy="76" rx="34" ry="9" />
                        <ellipse cx="62" cy="70" rx="22" ry="10" />
                        <ellipse cx="124" cy="84" rx="38" ry="9" />
                        <ellipse cx="108" cy="78" rx="20" ry="9" />
                    </g>
                    <g fill="#c9c9ff" opacity="0.7">
                        <ellipse cx="30" cy="88" rx="36" ry="8" />
                        <ellipse cx="140" cy="94" rx="30" ry="8" />
                    </g>
                </>
            );
        case 'pain-management':
            return (
                <>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                        <path
                            key={i}
                            d="M80 62 L76 6 L84 6Z"
                            fill="#ffd9a0"
                            opacity="0.22"
                            transform={`rotate(${i * 45} 80 62)`}
                        />
                    ))}
                    <circle cx="80" cy="62" r="34" fill="#ffd9a0" opacity="0.18" />
                    <circle cx="80" cy="62" r="22" fill="#ffd9a0" opacity="0.35" />
                    <circle cx="80" cy="62" r="12" fill="#fff4d6" />
                    <path d="M0 90 Q40 80 80 90 T160 88 V100 H0Z" fill="#2a1747" opacity="0.7" />
                </>
            );
        case 'confidence-building':
            return (
                <>
                    <circle cx="80" cy="70" r="30" fill="#ffd9a0" opacity="0.35" />
                    <circle cx="80" cy="70" r="19" fill="#fff0c4" />
                    <path
                        d="M0 100 L0 74 L36 52 L58 66 L82 34 L112 64 L134 50 L160 70 V100Z"
                        fill="#2a1e63"
                    />
                    <path d="M82 34 L74 48 L82 44 L90 49Z" fill="#fff" opacity="0.8" />
                    <path
                        d="M80 12 l2.2 6 6 2.2 -6 2.2 -2.2 6 -2.2 -6 -6 -2.2 6 -2.2z"
                        fill="#fff6dc"
                    />
                </>
            );
        case 'ibs-gut-calm':
            return (
                <>
                    <Moon x={128} y={26} r={8} />
                    <path d="M0 62 Q40 44 80 60 T160 52 V100 H0Z" fill="#2f8a7b" opacity="0.7" />
                    <path d="M0 78 Q50 62 90 78 T160 70 V100 H0Z" fill="#1d6a63" />
                    <path
                        d="M-4 98 C30 70 60 96 92 78 C116 66 130 74 168 62"
                        fill="none"
                        stroke="#bff3e6"
                        strokeWidth="9"
                        strokeLinecap="round"
                        opacity="0.75"
                    />
                    <path
                        d="M-4 98 C30 70 60 96 92 78 C116 66 130 74 168 62"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeDasharray="2 7"
                        opacity="0.8"
                    />
                </>
            );
        case 'mindful-eating':
            return (
                <>
                    <path d="M44 62 H116 a36 30 0 0 1 -72 0Z" fill="#fff0d6" />
                    <path d="M44 62 H116" stroke="#f5d6a8" strokeWidth="3" />
                    <path d="M58 90 H102 V94 H58Z" fill="#e7bd86" />
                    <g
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        opacity="0.55"
                    >
                        <path d="M66 52 q-6 -8 0 -14 q6 -6 0 -14" />
                        <path d="M82 50 q-6 -8 0 -14 q6 -6 0 -14" />
                        <path d="M98 52 q-6 -8 0 -14 q6 -6 0 -14" />
                    </g>
                    <path d="M130 70 q20 -26 22 -38 q-24 4 -22 38z" fill="#7fd1a0" />
                    <path
                        d="M130 70 q10 -18 18 -32"
                        stroke="#3f9b6a"
                        strokeWidth="1.5"
                        fill="none"
                    />
                </>
            );
        case 'smoke-free':
            return (
                <>
                    <circle cx="124" cy="28" r="12" fill="#fff6dc" />
                    <circle cx="124" cy="28" r="20" fill="#fff6dc" opacity="0.25" />
                    <path
                        d="M0 72 L40 36 L70 62 L104 40 L160 82 V100 H0Z"
                        fill="#4c7fb0"
                        opacity="0.7"
                    />
                    <path d="M0 84 L34 58 L66 80 L100 56 L160 90 V100 H0Z" fill="#2f5d8a" />
                    <path
                        d="M50 100 C58 88 70 82 86 78 C102 74 114 66 124 56"
                        fill="none"
                        stroke="#e6f6ff"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.8"
                    />
                    <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
                        <path d="M30 24 q4 -4 8 0 q4 -4 8 0" />
                        <path d="M56 38 q3 -3 6 0 q3 -3 6 0" />
                    </g>
                </>
            );
        case 'hands-at-peace':
            return (
                <>
                    <circle cx="80" cy="64" r="40" fill="#f6b6ff" opacity="0.18" />
                    <g transform="translate(80 78)">
                        {[-62, -31, 0, 31, 62].map(a => (
                            <path
                                key={a}
                                d="M0 0 C-12 -16 -12 -34 0 -50 C12 -34 12 -16 0 0Z"
                                fill="#ffd0f2"
                                opacity={a === 0 ? 1 : 0.85}
                                transform={`rotate(${a})`}
                            />
                        ))}
                        <circle r="6" fill="#ffd98a" />
                    </g>
                    <path d="M0 88 Q40 82 80 88 T160 88 V100 H0Z" fill="#fff" opacity="0.16" />
                    <path
                        d="M20 94 Q50 88 80 94 T140 94"
                        stroke="#fff"
                        strokeWidth="1.4"
                        fill="none"
                        opacity="0.3"
                    />
                </>
            );
        case 'embers-for-two':
            return (
                <>
                    <circle cx="66" cy="56" r="34" fill="#ff8a7a" opacity="0.5" />
                    <circle cx="94" cy="56" r="34" fill="#ffb86b" opacity="0.5" />
                    <path
                        d="M80 28 C66 38 66 52 80 62 C94 52 94 38 80 28Z"
                        fill="#fff0c4"
                        opacity="0.9"
                    />
                    <path d="M80 40 C74 46 74 54 80 60 C86 54 86 46 80 40Z" fill="#ff7a6b" />
                    <g fill="#ffd98a">
                        <circle cx="40" cy="22" r="1.4" />
                        <circle cx="118" cy="30" r="1.6" />
                        <circle cx="52" cy="84" r="1.2" />
                        <circle cx="112" cy="88" r="1.4" />
                        <circle cx="136" cy="64" r="1" />
                    </g>
                    <path d="M0 94 Q40 86 80 94 T160 92 V100 H0Z" fill="#1c0828" opacity="0.6" />
                </>
            );
        default:
            return (
                <>
                    <Moon x={80} y={34} r={10} />
                    <g fill="none" stroke="#fff" opacity="0.4">
                        <ellipse cx="80" cy="78" rx="26" ry="5" />
                        <ellipse cx="80" cy="78" rx="46" ry="9" opacity="0.7" />
                        <ellipse cx="80" cy="78" rx="68" ry="13" opacity="0.45" />
                    </g>
                </>
            );
    }
}

/** A small illustrated scene for a guided session, drawn in the app's dusk palette. */
export function SessionArt({ sessionId, className }: SessionArtProps) {
    const uid = useId().replace(/:/g, '');
    const gradId = `sa-${uid}`;
    const palette = PALETTES[sessionId] ?? { top: '#1d2a6b', bottom: '#6a6bd6' };

    return (
        <svg
            viewBox="0 0 160 100"
            preserveAspectRatio="xMidYMid slice"
            className={className}
            role="presentation"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.top} />
                    <stop offset="100%" stopColor={palette.bottom} />
                </linearGradient>
            </defs>
            <rect width="160" height="100" fill={`url(#${gradId})`} />
            <g fill="#fff">
                {STARS.map(([x, y, r], i) => (
                    <circle key={i} cx={x} cy={y} r={r} opacity="0.75" />
                ))}
            </g>
            <Scene id={sessionId} />
        </svg>
    );
}
