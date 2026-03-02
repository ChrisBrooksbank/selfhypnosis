import type { Metadata, Viewport } from 'next';
import './globals.css';

import { BottomNav } from '@components/layout/BottomNav';
import { SafetyGate } from '@components/layout/SafetyGate';

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
            <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
                <SafetyGate>
                    <div
                        className="mx-auto max-w-[640px] pb-20"
                        style={{
                            paddingTop: 'env(safe-area-inset-top)',
                            paddingLeft: 'env(safe-area-inset-left)',
                            paddingRight: 'env(safe-area-inset-right)',
                        }}
                    >
                        {children}
                    </div>
                    <BottomNav />
                </SafetyGate>
            </body>
        </html>
    );
}
