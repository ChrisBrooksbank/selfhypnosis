import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Self-Hypnosis',
    description:
        'Guided self-hypnosis sessions, technique library, and personal suggestion builder',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Self-Hypnosis',
    },
};

export const viewport: Viewport = {
    themeColor: '#6b5b95',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
        </html>
    );
}
