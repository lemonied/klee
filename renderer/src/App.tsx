import React, { FC, useEffect } from 'react';
import './App.scss';
import { Layout, Header } from './components';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useLocation, Switch, Route } from 'react-router-dom';
import { routes } from './routes';
import { centralEventbus } from './helpers/eventbus';

const App: FC = () => {
  const location = useLocation();

  useEffect(() => {
    const subscription = centralEventbus.on('log').subscribe(res => {
      // eslint-disable-next-line no-console
      console.log(res.message);
    });
    return () => subscription.unsubscribe();
  }, []);

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
          classNames={'route-fade'}
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
