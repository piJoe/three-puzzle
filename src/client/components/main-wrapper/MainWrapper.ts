import m, { Vnode } from 'mithril';

export const MainWrapper = {
    view: function (vnode: Vnode) {
        return m('.main-container', vnode.children);
    }
};