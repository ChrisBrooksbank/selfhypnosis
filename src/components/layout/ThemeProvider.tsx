'use client';

import { useEffect } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@lib/db';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme): void {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
    } else if (theme === 'light') {
        html.classList.remove('dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) html.classList.add('dark');
        else html.classList.remove('dark');
    }
}

export function ThemeProvider() {
    const settings = useLiveQuery(() => db.settings.get('user'));

    useEffect(() => {
        const theme = settings?.theme ?? 'system';
        applyTheme(theme);
    }, [settings?.theme]);

    useEffect(() => {
        const theme = settings?.theme ?? 'system';
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            if (e.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [settings?.theme]);

    return null;
}
