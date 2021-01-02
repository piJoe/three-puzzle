import './scss/style.scss';

import './polyfills';
import m from 'mithril';
import { mapObjIndexed } from "ramda";
import { PuzzleGeneratorPage } from 'client/components/pages/puzzle-generator/PuzzleGeneratorPage';
import { MainWrapper } from 'client/components/main-wrapper/MainWrapper';
import { PuzzleRenderPage } from './components/pages/puzzle-render/PuzzleRenderPage';

const routeMap = {
    '/': {
        renderWrapper: true,
        page: PuzzleGeneratorPage
    },
    '/render': {
        renderWrapper: false,
        page: PuzzleRenderPage
    },
};

const routes = mapObjIndexed((route) => ({
    render: () => {
        return m(MainWrapper, {
            renderWrapper: route.renderWrapper,
        },m(route.page));
    }
}), routeMap);
m.route(document.body, '/', routes);