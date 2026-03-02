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
        background_color: '#f9fafb',
        theme_color: '#6366f1',
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
