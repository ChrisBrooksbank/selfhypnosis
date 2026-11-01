import { useId } from 'react';

export type LullMood = 'calm' | 'awake' | 'proud' | 'sleepy';

interface LullProps {
    mood?: LullMood;
    /** Rendered width and height in px. */
    size?: number;
    /** Draw the slow ripple rings behind the moon. */
    ripples?: boolean;
    className?: string;
}

/**
 * Lull, the app's mascot: a sleepy little moon in a nightcap, sitting in the middle of the
 * ripples that make up the app's hypnotic motif. Purely decorative.
 */
export function Lull({ mood = 'calm', size = 120, ripples = true, className }: LullProps) {
    const uid = useId().replace(/:/g, '');
    const face = `lull-face-${uid}`;
    const cap = `lull-cap-${uid}`;
    const glow = `lull-glow-${uid}`;

    return (
        <svg
            viewBox="-6 6 212 212"
            width={size}
            height={size}
            className={className}
            role="presentation"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id={glow} cx="50%" cy="55%" r="50%">
                    <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={face} cx="38%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="#fff6dc" />
                    <stop offset="70%" stopColor="#ffe3a1" />
                    <stop offset="100%" stopColor="#f6c470" />
                </radialGradient>
                <linearGradient id={cap} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c6cf0" />
                    <stop offset="100%" stopColor="#4b3bb0" />
                </linearGradient>
            </defs>

            {ripples && (
                <g fill="none" stroke="#a99bff" strokeWidth="1.5">
                    <circle cx="100" cy="112" r="70" opacity="0.5" />
                    <circle cx="100" cy="112" r="82" opacity="0.32" />
                    <circle cx="100" cy="112" r="94" opacity="0.18" />
                </g>
            )}
            <circle cx="100" cy="112" r="78" fill={`url(#${glow})`} />

            {/* moon */}
            <circle cx="100" cy="112" r="56" fill={`url(#${face})`} />
            <g fill="#f0b95f" opacity="0.45">
                <circle cx="128" cy="136" r="7" />
                <circle cx="76" cy="144" r="4.5" />
                <circle cx="136" cy="104" r="3.5" />
            </g>

            {/* nightcap */}
            <path
                d="M50 92 C58 52 98 30 140 38 C168 44 176 62 168 70 C150 62 126 66 112 80 C96 96 70 100 50 92 Z"
                fill={`url(#${cap})`}
            />
            <path
                d="M46 90 C70 104 102 100 118 84 C130 72 150 66 170 72"
                fill="none"
                stroke="#efe9ff"
                strokeWidth="9"
                strokeLinecap="round"
            />
            <path
                d="M172 66 L184 52 L186 70 L200 64 L190 76 Z"
                fill="#ffd98a"
                transform="translate(-14 -2) scale(0.95)"
            />

            {/* cheeks */}
            <g fill="#ff9aa8" opacity="0.5">
                <ellipse cx="76" cy="124" rx="8" ry="5" />
                <ellipse cx="124" cy="124" rx="8" ry="5" />
            </g>

            {/* eyes and mouth */}
            <g
                fill="none"
                stroke="#4a3a2a"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {mood === 'awake' ? (
                    <>
                        <circle cx="82" cy="114" r="4.2" fill="#4a3a2a" stroke="none" />
                        <circle cx="118" cy="114" r="4.2" fill="#4a3a2a" stroke="none" />
                        <path d="M90 130 Q100 138 110 130" />
                    </>
                ) : mood === 'proud' ? (
                    <>
                        <path d="M73 116 Q82 106 91 116" />
                        <path d="M109 116 Q118 106 127 116" />
                        <path d="M88 129 Q100 143 112 129" fill="#c9585f" stroke="#4a3a2a" />
                    </>
                ) : (
                    <>
                        <path d="M73 112 Q82 121 91 112" />
                        <path d="M109 112 Q118 121 127 112" />
                        <path d="M92 131 Q100 137 108 131" />
                    </>
                )}
            </g>

            {mood === 'sleepy' && (
                <g fill="#cfc6ff" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700">
                    <text x="150" y="60" fontSize="22">
                        z
                    </text>
                    <text x="168" y="42" fontSize="16" opacity="0.8">
                        z
                    </text>
                </g>
            )}
            {mood === 'proud' && (
                <g fill="#ffd98a">
                    <path d="M28 70 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
                    <path d="M170 150 l2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5z" />
                </g>
            )}
        </svg>
    );
}
