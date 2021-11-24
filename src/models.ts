export interface Bitmap {
  width: number;
  height: number;
  image: Buffer;
}

export interface Area {
  width: number;
  height: number;
  left: number;
  top: number;
}

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
  bitmap: Bitmap;
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
  ignores?: Array<'h' | 's' | 'v'>;
}

export interface ProcessTypePicker {
  type: 'picker';
  crop?: CropData;
  area?: Area;
  passed?: boolean;
  skip?: boolean;
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
  keyPath: Array<number | string>;
  crop: CropData;
  conditions: PickerCondition[];
  area?: Area;
}
