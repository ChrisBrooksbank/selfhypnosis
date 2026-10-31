import { afterEach, describe, expect, it, vi } from 'vitest';

import { collectNarrationItems } from './pageText';

vi.mock('./contentAudio', () => ({
    contentClip: (key: string) =>
        key.startsWith('known/') ? `/audio/content/${key}.mp3` : undefined,
}));

function page(html: string) {
    document.body.innerHTML = html;
    return collectNarrationItems(document.body);
}

describe('collectNarrationItems', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('reads headings, paragraphs and list items in document order', () => {
        const items = page(`
            <h1>Title</h1>
            <p>First paragraph.</p>
            <ul><li>One</li><li>Two</li></ul>
        `);
        expect(items.map(i => i.text)).toEqual(['Title', 'First paragraph.', 'One', 'Two']);
        expect(items.every(i => i.clip === undefined)).toBe(true);
    });

    it('skips navigation, buttons, icons, hidden and data-no-speech content', () => {
        const items = page(`
            <nav><a>Home</a><a>Library</a></nav>
            <p>Keep me.</p>
            <button>Click</button>
            <p aria-hidden="true">Decoration</p>
            <div data-no-speech><p>References [1]</p></div>
            <p hidden>Hidden</p>
        `);
        expect(items.map(i => i.text)).toEqual(['Keep me.']);
    });

    it('strips buttons and icons from inside a block but keeps its words', () => {
        const items = page(`<li>Choose a thing <button>Yes</button><svg></svg> carefully</li>`);
        expect(items.map(i => i.text)).toEqual(['Choose a thing carefully']);
    });

    it('reads a tagged block once, with its recorded clip when one exists', () => {
        const items = page(`
            <div data-speech-clip="known/intro"><h1>Welcome</h1><p>Hello there.</p></div>
            <ul><li data-speech-clip="known/step-1"><span>1</span><p>Do this.</p></li></ul>
        `);
        expect(items).toEqual([
            { text: 'Welcome Hello there.', clip: '/audio/content/known/intro.mp3' },
            { text: '1 Do this.', clip: '/audio/content/known/step-1.mp3' },
        ]);
    });

    it('falls back to text only when a tagged block has no recording yet', () => {
        const items = page(`<p data-speech-clip="unknown/key">No clip yet.</p>`);
        expect(items).toEqual([{ text: 'No clip yet.', clip: undefined }]);
    });

    it('does not read a block twice when it contains inner blocks', () => {
        const items = page(`<ul><li><p>Inner paragraph.</p></li></ul>`);
        expect(items.map(i => i.text)).toEqual(['Inner paragraph.']);
    });

    it('reads stand-alone text boxes such as stat tiles, but not spans inside paragraphs', () => {
        const items = page(`
            <div><div>12</div><span>day streak</span></div>
            <p>Practice <span>daily</span> for best results.</p>
        `);
        expect(items.map(i => i.text)).toEqual([
            '12',
            'day streak',
            'Practice daily for best results.',
        ]);
    });

    it('ignores empty and punctuation-only text', () => {
        const items = page(`<p>   </p><p>—</p><p>Real words</p>`);
        expect(items.map(i => i.text)).toEqual(['Real words']);
    });
});
