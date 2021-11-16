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
  id: string;
  width: number;
  height: number;
  left: number;
  top: number;
  [prop: string]: any;
}

export interface ProcessTypePicker {
  type: 'picker';
  crop?: CropData;
  rgb?: RGB[];
  grayscale?: number[];
  hsv?: HSV[];
  lightness?: number;
  children: this[];
}
export interface ProcessTypeGeneral {
  type: 'general';
  key: string;
  keydown: number;
  keyup: number;
  children: this[];
}

export type ProcessItem = ProcessTypePicker | ProcessTypeGeneral;
