import { ReducersMapObject, Reducer } from 'redux';
import { originalReducers } from './reducers';
import { store } from './index';
import { randomStr } from '../helpers/utils';
import { useSelector, useDispatch } from 'react-redux';
import { Map } from 'immutable';
import { useCallback } from 'react';
import { combineReducers } from 'redux-immutable';

export const makeAllReducers = (reducers: ReducersMapObject): Reducer => (combineReducers({ ...reducers }));

// Inject reducer dynamically.
export const injectReducer = (key: string, reducer: Reducer) => {
  if (Object.hasOwnProperty.call(originalReducers, key)) {
    /*
    * This reducer has been injected.
    */
    return;
  }
  Object.assign(originalReducers, { [key]: reducer });
  store.replaceReducer(
    makeAllReducers(originalReducers),
  );
};

interface InjectToken<S> {
  token: string;
  SET_ACTION: symbol;
  defaultState: S;
}

export const injectStore = <S>(namespace: string, defaultState: S): InjectToken<S> => {
  const token = randomStr(namespace);
  const SET_ACTION = Symbol(`SET_${token}`);
  const reducer = (defaultStates: S = defaultState, action: any) => {
    switch (action.type) {
      case SET_ACTION:
        return action.value;
      default:
        return defaultState;
    }
  };
  injectReducer(token, reducer);
  return { token, SET_ACTION, defaultState };
};

export const useBee = <S>(token: InjectToken<S>): [InjectToken<S>['defaultState'], ((value: InjectToken<S>['defaultState']) => void)] => {
  const selector = useSelector((state: Map<string, InjectToken<S>['defaultState']>) => state.get(token.token) as InjectToken<S>['defaultState']);
  const dispatch = useDispatch();
  const setBee = useCallback((value: InjectToken<S>['defaultState']) => {
    dispatch({
      type: token.SET_ACTION,
      value: value,
    });
  }, [dispatch, token.SET_ACTION]);
  return [selector, setBee];
};

export const getBee = <S>(token: InjectToken<S>) => {
  return store.getState().get(token) as InjectToken<S>['defaultState'];
};

export const setBee = <S>(token: InjectToken<S>, value: InjectToken<S>['defaultState']): void => {
  store.dispatch({
    type: token.SET_ACTION,
    value,
  });
};
