import m from 'mithril';

export const MainWrapper = {
    view: function (vnode) {
        return m('.main-container', vnode.children);
    }
};