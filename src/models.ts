import * as Buffer from 'buffer';

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

export interface Point {
  x: number;
  y: number
}

export interface ImagePoint extends Point {
  pixel: RGB;
}

export type ImageVector = RGB[];

export interface SnapshotItem {
  id: string;
  timestamp: number;
  buffer: Buffer,
}

export interface CropData {
  id: string;
  width: number;
  height: number;
  left: number;
  top: number;
  [prop: string]: any;
}
