import { Home } from './views/home/Home';
import { About } from './views/about/About';
import { Experiment } from './views/experiment/Experiment';

export const routes = [
  {
    path: '/about',
    exact: true,
    Component: About,
  },
  {
    path: '/experiment',
    exact: true,
    Component: Experiment,
  },
  {
    path: '/',
    exact: false,
    Component: Home,
  },
];
