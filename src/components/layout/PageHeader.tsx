'use client';

import { useRouter } from 'next/navigation';

interface PageHeaderProps {
    title: string;
    showBack?: boolean;
    onBack?: () => void;
}

export function PageHeader({ title, showBack = false, onBack }: PageHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
            {showBack && (
                <button
                    onClick={handleBack}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                    aria-label="Go back"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-gray-600"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
            )}
            <h1 className="flex-1 text-lg font-semibold text-gray-900">{title}</h1>
        </header>
    );
}
