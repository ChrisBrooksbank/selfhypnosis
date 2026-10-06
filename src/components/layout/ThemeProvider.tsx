'use client';

import { useEffect } from 'react';

import { useLiveQuery } from '@hooks/useDexieQuery';
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
    // Live query so a theme picked in Settings takes effect (and the system
    // listener is added/removed) without a reload.
    const theme: Theme =
        useLiveQuery(async () => (await db.settings.get('user'))?.theme) ?? 'system';

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            if (e.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    return null;
}
