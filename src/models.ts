import * as Buffer from 'buffer';

export interface RGB {
  r: number;
  g: number;
  b: number;
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
  buffer: Buffer,
}
