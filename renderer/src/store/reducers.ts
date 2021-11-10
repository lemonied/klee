import { combineReducers } from 'redux-immutable';
import { ReducersMapObject } from 'redux';

export const originalReducers: ReducersMapObject = {
  author: () => {
    return 'ChenJiYuan';
  },
};

export default combineReducers({ ...originalReducers });
