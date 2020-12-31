import m, { Vnode } from 'mithril';
import { IPage } from 'client/components/pages/IPage';

export const PuzzleGeneratorPage: IPage = {
    view: (): Vnode => {
        return m('.puzzle-gen', [
            m('h1', 'Puzzle gen here...')
        ]);
    }
};