'use client';

import { useCallback, useEffect, useState } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@lib/db';
import { Logger } from '@utils/logger';

export interface NotificationsState {
    notificationsEnabled: boolean;
    notificationTime: string | undefined;
    permissionState: NotificationPermission | 'unsupported';
    showBanner: boolean;
    enableNotifications: (time: string) => Promise<void>;
    disableNotifications: () => Promise<void>;
    setNotificationTime: (time: string) => Promise<void>;
    dismissBanner: () => void;
}

const LAST_NOTIFIED_KEY = 'hypnosis_last_notified';

function isPastScheduledTime(notificationTime: string): boolean {
    const parts = notificationTime.split(':');
    if (parts.length < 2) return false;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    return now >= scheduled;
}

export function useNotifications(): NotificationsState {
    const settings = useLiveQuery(() => db.settings.get('user'));
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const permissionState: NotificationPermission | 'unsupported' =
        typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

    const notificationsEnabled = settings?.notificationsEnabled ?? false;
    const notificationTime = settings?.notificationTime;

    // Show in-app banner fallback when app opened after scheduled time
    const showBanner =
        !bannerDismissed &&
        notificationsEnabled &&
        !!notificationTime &&
        isPastScheduledTime(notificationTime);

    // Attempt Web Notification when permission granted and scheduled time has passed
    useEffect(() => {
        if (
            !notificationsEnabled ||
            !notificationTime ||
            !isPastScheduledTime(notificationTime) ||
            typeof Notification === 'undefined' ||
            Notification.permission !== 'granted'
        ) {
            return;
        }

        const today = new Date().toDateString();
        const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY);
        if (lastNotified === today) return;

        try {
            new Notification('Time for your hypnosis session', {
                body: 'Your daily practice reminder — take a moment to relax.',
                icon: '/icons/icon-192.png',
            });
            localStorage.setItem(LAST_NOTIFIED_KEY, today);
            Logger.info('Daily reminder notification sent');
        } catch (_err) {
            Logger.warn('Failed to send Web Notification');
        }
    }, [notificationsEnabled, notificationTime]);

    const enableNotifications = useCallback(async (time: string) => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            const result = await Notification.requestPermission();
            Logger.info(`Notification permission result: ${result}`);
        }

        await db.settings.update('user', {
            notificationsEnabled: true,
            notificationTime: time,
        });

        Logger.info(`Notifications enabled at ${time}`);
    }, []);

    const disableNotifications = useCallback(async () => {
        await db.settings.update('user', {
            notificationsEnabled: false,
        });
        Logger.info('Notifications disabled');
    }, []);

    const setNotificationTime = useCallback(async (time: string) => {
        await db.settings.update('user', {
            notificationTime: time,
        });
        Logger.info(`Notification time updated to ${time}`);
    }, []);

    const dismissBanner = useCallback(() => {
        setBannerDismissed(true);
    }, []);

    return {
        notificationsEnabled,
        notificationTime,
        permissionState,
        showBanner,
        enableNotifications,
        disableNotifications,
        setNotificationTime,
        dismissBanner,
    };
}
