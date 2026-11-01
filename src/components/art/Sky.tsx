interface SkyProps {
    /** Number of stars. */
    count?: number;
    className?: string;
}

/** Deterministic pseudo-random so server and client render the same stars. */
function rand(seed: number): number {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

/** A field of faint stars, absolutely positioned to fill its (relative) parent. */
export function Sky({ count = 46, className }: SkyProps) {
    const stars = Array.from({ length: count }, (_, i) => ({
        x: rand(i + 1) * 100,
        y: rand(i + 101) * 100,
        r: 0.25 + rand(i + 201) * 0.75,
        o: 0.25 + rand(i + 301) * 0.65,
    }));

    return (
        <svg
            className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ''}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            {stars.map((s, i) => (
                <ellipse
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    rx={s.r * 0.6}
                    ry={s.r}
                    fill="#fff"
                    opacity={s.o}
                />
            ))}
        </svg>
    );
}
