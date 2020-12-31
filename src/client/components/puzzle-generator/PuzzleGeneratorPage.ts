import m, { Vnode } from 'mithril';
import { IPage } from 'client/components/IPage';

export const PuzzleGeneratorPage: IPage = {
    hideMainLayout: true,
    view: function () {
        return m('.puzzle-gen', [
            m('h1', 'Puzzle gen here...')
        ]);
    }
};