export type Direction = "up" | "down" | "left" | "right" | "none";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector2; // tile coordinates with sub-tile fractional value
  dir: Direction;
  speed: number; // tiles per second
}

export interface Ghost extends Entity {
  name: "blinky" | "pinky" | "inky" | "clyde";
  mode: "chase" | "scatter" | "frightened" | "eaten";
  color: string;
  frightUntil: number; // millis epoch when frightened ends
}

export interface GameStateData {
  score: number;
  lives: number;
  level: number;
  pelletsRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  isWin: boolean;
}

export type Tile = 0 | 1 | 2 | 3 | 4; // 0 empty, 1 wall, 2 pellet, 3 power, 4 gate
