import React, { FC } from 'react';
import './App.scss';
import { Layout, Header } from './components';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useLocation, Switch, Route } from 'react-router-dom';
import { routes } from './routes';

const App: FC = () => {
  const location = useLocation();

  return (
    <Layout
      className={'root-app'}
      header={<Header />}
      fixed={true}
    >
      <TransitionGroup
        className={'root-routes-group'}
      >
        <CSSTransition
          classNames={'fade'}
          timeout={300}
          key={location.pathname}
        >
          <Switch location={location}>
            {
              routes.map(Item => (
                <Route
                  exact={ Item.exact }
                  path={ Item.path }
                  key={ Item.path }
                  component={ Item.Component }
                />
              ))
            }
          </Switch>
        </CSSTransition>
      </TransitionGroup>
    </Layout>
  );
};

export default App;
