import { SessionPlayerClient } from './SessionPlayerClient';

export function generateStaticParams() {
    // A placeholder so the static build succeeds; real navigation is client-side.
    // With output: 'export', dynamicParams defaults to false — only listed params are pre-rendered,
    // but client-side navigation still works for any sessionId.
    return [{ sessionId: 'placeholder' }];
}

interface Props {
    params: Promise<{ sessionId: string }>;
}

export default async function SessionPlayerPage({ params }: Props) {
    const { sessionId } = await params;
    return <SessionPlayerClient sessionId={sessionId} />;
}
