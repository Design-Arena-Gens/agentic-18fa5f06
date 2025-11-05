import type { Tile } from "./types";

// Simplified 28x31 map inspired by classic Pac-Man
// Legend: 1 wall, 0 empty, 2 pellet, 3 power, 4 gate (ghost house gate)
// We'll fill with pellets (2) automatically where there is 0 and not in ghost house.

export const COLS = 28;
export const ROWS = 31;

const W = 1 as Tile;
const O = 0 as Tile;
const G = 4 as Tile;
const P = 3 as Tile;

// Base layout: walls and special tiles
export const BASE_MAP: Tile[][] = [
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  [W,O,O,O,O,O,O,W,W,O,O,O,O,O,O,O,O,O,O,O,O,O,W,W,O,O,O,W],
  [W,O,W,W,W,O,O,W,W,O,W,W,W,W,W,W,W,W,W,W,O,W,W,O,W,O,O,W],
  [W,O,W,W,W,O,O,W,W,O,W,W,W,W,W,W,W,W,W,W,O,W,W,O,W,O,O,W],
  [W,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,W],
  [W,O,W,W,W,O,W,W,W,W,W,O,W,W,W,W,W,O,W,W,W,W,W,O,W,W,O,W],
  [W,O,O,O,O,O,O,O,O,O,W,O,O,O,O,O,O,O,O,O,O,O,W,O,O,O,O,W],
  [W,W,W,W,W,O,W,W,W,O,W,W,W,W,W,W,W,W,W,O,W,W,W,O,W,W,W,W],
  [W,O,O,O,O,O,W,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,W,O,O,O,O,W],
  [W,O,W,W,W,O,W,O,W,W,W,O,W,W,W,W,W,O,W,W,W,O,W,O,W,W,O,W],
  [W,O,O,O,W,O,O,O,W,G,W,O,O,O,O,O,O,O,O,O,W,O,O,O,W,O,O,W],
  [W,W,W,O,W,W,W,W,W,G,W,W,W,W,W,W,W,W,W,W,W,W,W,O,W,O,W,W],
  [O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O],
  [W,W,W,O,W,W,W,W,W,W,W,O,W,W, W,W,W,O,W,W,W,W,W,O,W,O,W,W],
  [W,O,O,O,W,O,O,O,O,O,W,O,O,O,O,O,O,O,O,O,W,O,O,O,W,O,O,W],
  [W,O,W,W,W,O,W,W,W,O,W,W,W,W,W,W,W,W,W,O,W,O,W,W,W,O,W,W],
  [W,O,O,O,O,O,W,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,W],
  [W,W,W,W,W,O,W,O,W,W,W,O,W,W,W,W,W,O,W,W,W,O,W,O,W,W,W,W],
  [W,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,W],
  [W,O,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,O,W],
  [W,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,O,W],
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  // Pad to 31 rows by duplicating last simple rows
];

while (BASE_MAP.length < ROWS) {
  BASE_MAP.push([...BASE_MAP[BASE_MAP.length - 1]]);
}

export function generatePellets(map: Tile[][]): Tile[][] {
  const out = map.map((row) => [...row]);
  // Fill pellets in empty tiles, avoid ghost house center.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (out[y][x] === 0) {
        // Ghost house region roughly at center
        const inHouse = y >= 10 && y <= 14 && x >= 11 && x <= 16;
        out[y][x] = inHouse ? 0 : 2;
      }
    }
  }
  // Place four power pellets near corners
  const corners: Array<[number, number]> = [
    [1, 3],
    [COLS - 2, 3],
    [1, ROWS - 4],
    [COLS - 2, ROWS - 4],
  ];
  for (const [cx, cy] of corners) {
    out[cy][cx] = 3;
  }
  return out;
}
