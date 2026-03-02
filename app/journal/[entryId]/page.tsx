import { JournalEntryView } from '@components/journal/JournalEntryView';

export function generateStaticParams() {
    // Entry IDs are runtime UUIDs stored in IndexedDB.
    // A placeholder is exported so the static build succeeds; real navigation is client-side.
    return [{ entryId: 'placeholder' }];
}

interface Props {
    params: Promise<{ entryId: string }>;
}

export default async function JournalEntryPage({ params }: Props) {
    const { entryId } = await params;

    return <JournalEntryView entryId={entryId} />;
}
