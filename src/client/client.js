import './scss/style.scss';

import m from 'mithril';
import { mapObjIndexed } from "ramda";
import { PuzzleGeneratorPage } from 'client/components/pages/puzzle-generator/PuzzleGeneratorPage';
import { MainWrapper } from 'client/components/main-wrapper/MainWrapper';

const routeMap = {
    '/': {
        hideMainLayout: false,
        page: PuzzleGeneratorPage
    },
};

const routes = mapObjIndexed((route) => ({
    render: () => {
        if (route.hideMainLayout) {
            return m(route.page);
        }
        return m(MainWrapper, m(route.page));
    }
}), routeMap);
m.route(document.body, '/', routes);