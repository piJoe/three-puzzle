import './scss/style.scss';

import m from 'mithril';
import { PuzzleGeneratorPage } from './components/puzzle-generator/PuzzleGeneratorPage';

const routes = {
    '/': PuzzleGeneratorPage,
};

m.route(document.body, '/', routes);