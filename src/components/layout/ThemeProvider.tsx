'use client';

import { useEffect, useState } from 'react';

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
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const settings = await db.settings.get('user');
                if (!cancelled) setTheme(settings?.theme ?? 'system');
            } catch {
                // ignore
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

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
