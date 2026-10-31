/**
 * Works out what to read aloud on the current page.
 *
 * Headings, paragraphs, list items and labels are read in document order. Blocks tagged
 * with `data-speech-clip="<key>"` are read once as a whole, using their recorded clip when
 * one exists (the block's own text is the fallback). Navigation, buttons, form controls,
 * icons and anything marked `data-no-speech` are skipped, as are reference lists.
 */

import { contentClip } from './contentAudio';
import type { NarrationItem } from './narrator';

const BLOCK = 'h1,h2,h3,h4,p,li,label,blockquote,td,th,dt,dd,summary,[role="alert"]';
const SKIP =
    'nav,button,select,textarea,input,script,style,svg,[aria-hidden="true"],[hidden],[data-no-speech]';
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** The element's text with skipped parts (buttons, icons…) removed and spacing tidied. */
function visibleText(el: Element): string {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll(SKIP).forEach(n => n.remove());
    // textContent glues neighbouring blocks together ("WelcomeHello"); keep them apart.
    clone.querySelectorAll(`${BLOCK},div,br`).forEach(n => {
        n.before(' ');
        n.after(' ');
    });
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function isHidden(el: HTMLElement): boolean {
    return typeof el.checkVisibility === 'function' ? !el.checkVisibility() : false;
}

export function collectNarrationItems(root: ParentNode = document.body): NarrationItem[] {
    const items: NarrationItem[] = [];
    const seenWrappers = new Set<Element>();

    const nodes = root.querySelectorAll<HTMLElement>(`[data-speech-clip],${BLOCK},div,span`);
    for (const el of nodes) {
        if (el.closest(SKIP) || isHidden(el)) continue;

        const wrapper = el.closest<HTMLElement>('[data-speech-clip]');
        if (wrapper) {
            if (seenWrappers.has(wrapper)) continue;
            seenWrappers.add(wrapper);
            const text = visibleText(wrapper);
            if (LETTER_OR_DIGIT.test(text)) {
                items.push({ text, clip: contentClip(wrapper.dataset.speechClip ?? '') });
            }
            continue;
        }

        const isBlock = el.matches(BLOCK);
        const isLeafBox =
            (el.tagName === 'DIV' || el.tagName === 'SPAN') && el.children.length === 0;
        if (!isBlock && !isLeafBox) continue;
        if (isLeafBox && el.closest(BLOCK)) continue; // already part of a block
        if (isBlock && el.querySelector(BLOCK)) continue; // read its inner blocks instead

        const text = visibleText(el);
        if (LETTER_OR_DIGIT.test(text)) items.push({ text });
    }
    return items;
}
