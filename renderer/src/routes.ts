import { Home } from './views/home/Home';
import { About } from './views/about/About';

export const routes = [
  {
    path: '/about',
    exact: true,
    Component: About,
  },
  {
    path: '/',
    exact: false,
    Component: Home,
  },
];
