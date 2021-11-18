import * as Buffer from 'buffer';
import Jimp from 'jimp';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface SnapshotItem {
  id: string;
  timestamp: number;
  buffer: Buffer,
  dataURL: string;
  jimp: Jimp;
}

export interface CropData {
  id?: string;
  width: number;
  height: number;
  left: number;
  top: number;
  rgb?: RGB[];
  grayscale?: number[];
  hsv?: HSV[];
  lightness?: number;
}

export interface PickerCondition {
  type: 'lightness' | 'texture' | 'absolute';
  value: number;
  size: 'more' | 'less';
}

export interface ProcessTypePicker {
  type: 'picker';
  crop?: CropData;
  passed?: boolean;
  otherwise: boolean;
  conditions: PickerCondition[];
  children: this[];
}
export interface ProcessTypeGeneral {
  type: 'general';
  key: string;
  keydown: number;
  keyup: number;
}
export interface ProcessTypeTimeout {
  type: 'timeout';
  value: number;
}

export type ProcessItem = ProcessTypePicker | ProcessTypeGeneral | ProcessTypeTimeout;

export interface SharedWorkerData {
  keyPath: number[];
  crop: CropData;
}
