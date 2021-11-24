import { Map, List } from 'immutable';

export interface ImmutableMap<T> extends Map<keyof T, T[keyof T]> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): this;
}

export interface CropperData {
  id: string;
  base64: string;
  width: number;
  height: number;
  left: number;
  top: number;
  [prop: string]: any;
}

export type Area = ImmutableMap<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export type Ignores = List<'h' | 's' | 'v'>;

export type Condition = ImmutableMap<{
  type: 'lightness' | 'texture' | 'absolute';
  value: number;
  size: 'more' | 'less';
  ignores?: Ignores;
}>;

export type Conditions = List<Condition>;

export type ProcessItem = ImmutableMap<{
  id: string;
  type: 'general' | 'picker' | 'timeout';
  key: string;
  keydown: number;
  keyup: number;
  value: number;
  crop?: CropperData;
  area?: Area;
  conditions?: Conditions;
  otherwise: boolean;
  available: boolean;
  children: ProcessList;
}>;

export type ProcessList = List<ProcessItem>;
