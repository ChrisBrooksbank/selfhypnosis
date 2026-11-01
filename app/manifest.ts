import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Self-Hypnosis',
        short_name: 'Hypnosis',
        description:
            'Guided self-hypnosis sessions, technique library, and personal suggestion builder',
        start_url: '/',
        display: 'standalone',
        background_color: '#120f33',
        theme_color: '#2a2070',
        orientation: 'portrait',
        categories: ['health', 'lifestyle'],
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-384.png',
                sizes: '384x384',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
