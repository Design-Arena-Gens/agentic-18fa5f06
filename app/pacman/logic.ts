import { COLS, ROWS } from "./level";
import type { Direction, Vector2 } from "./types";

export const TILE_SIZE = 22; // px
export const CANVAS_W = COLS * TILE_SIZE;
export const CANVAS_H = ROWS * TILE_SIZE;

export function add(v: Vector2, w: Vector2): Vector2 {
  return { x: v.x + w.x, y: v.y + w.y };
}

export function dirToVec(dir: Direction): Vector2 {
  switch (dir) {
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function wrapX(x: number): number {
  if (x < 0) return COLS - 1 + x;
  if (x >= COLS) return x - COLS;
  return x;
}

export function clampToGrid(v: Vector2): Vector2 {
  return { x: Math.max(0, Math.min(COLS - 1, v.x)), y: Math.max(0, Math.min(ROWS - 1, v.y)) };
}

export function tileCenter(pos: Vector2): Vector2 {
  return { x: Math.round(pos.x), y: Math.round(pos.y) };
}

export function manhattan(a: Vector2, b: Vector2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
