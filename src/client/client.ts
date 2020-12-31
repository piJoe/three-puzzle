import './scss/style.scss';

import m from 'mithril';
import { mapObjIndexed } from "ramda";
import { IPage } from 'client/components/IPage';
import { PuzzleGeneratorPage } from 'client/components/puzzle-generator/PuzzleGeneratorPage';
import { MainWrapper } from 'client/components/main-wrapper/MainWrapper';

const routeMap = {
    '/': PuzzleGeneratorPage,
};

const routes = mapObjIndexed((r: IPage): any => ({
    render: () => {
        if (r.hideMainLayout) {
            return m(r);
        }
        return m(MainWrapper, m(r));
    }
}), routeMap);
m.route(document.body, '/', routes);