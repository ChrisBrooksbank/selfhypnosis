'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavTab {
    href: string;
    label: string;
    icon: React.ReactNode;
    matchPaths?: string[];
}

const tabs: NavTab[] = [
    {
        href: '/',
        label: 'Home',
        matchPaths: ['/'],
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
            >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        href: '/library',
        label: 'Library',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
            >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
    {
        href: '/session',
        label: 'Session',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
            >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
        ),
    },
    {
        href: '/journal',
        label: 'Journal',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
            >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

function isTabActive(href: string, pathname: string, matchPaths?: string[]): boolean {
    if (matchPaths) {
        return matchPaths.includes(pathname);
    }
    return pathname === href || pathname.startsWith(href + '/');
}

export function BottomNav() {
    const pathname = usePathname();
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsFullscreen(document.documentElement.hasAttribute('data-fullscreen'));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-fullscreen'],
        });
        setIsFullscreen(document.documentElement.hasAttribute('data-fullscreen'));

        return () => observer.disconnect();
    }, []);

    if (isFullscreen) {
        return null;
    }

    return (
        <nav
            className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <ul className="mx-auto flex max-w-[640px] items-center justify-around">
                {tabs.map(tab => {
                    const active = isTabActive(tab.href, pathname, tab.matchPaths);
                    return (
                        <li key={tab.href} className="flex-1">
                            <Link
                                href={tab.href}
                                className={`flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                                    active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <span className={active ? 'text-indigo-600' : 'text-gray-400'}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
