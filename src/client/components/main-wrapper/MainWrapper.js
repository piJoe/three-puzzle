import './style.scss';

import m from 'mithril';

export const MainWrapper = {
    view: function (vnode) {
        return [
            m('.main-header', [
                m('a', {href: '#!/'}, 'Generate'),
                ' ',
                m('a', {href: '#!/render'}, 'Render'),
            ]),
            vnode.attrs.renderWrapper ? m('.main-container', vnode.children) : [...vnode.children],
        ];
    }
};