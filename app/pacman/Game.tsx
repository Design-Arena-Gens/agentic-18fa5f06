"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { BASE_MAP, COLS, ROWS, generatePellets } from "./level";
import { CANVAS_W, CANVAS_H, dirToVec, randomChoice } from "./logic";
import { clear, drawWalls, drawPellets, drawPacman, drawGhost, drawHUD } from "./render";
import type { Direction, GameStateData, Ghost, Tile } from "./types";

const INITIAL_SPEED = 6; // tiles/sec for Pac-Man
const GHOST_SPEED = 5.5; // tiles/sec
const FRIGHT_DURATION_MS = 6000;

function useKeys() {
  const nextDir = useRef<Direction>("none");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "w"].includes(k)) nextDir.current = "up";
      else if (["arrowdown", "s"].includes(k)) nextDir.current = "down";
      else if (["arrowleft", "a"].includes(k)) nextDir.current = "left";
      else if (["arrowright", "d"].includes(k)) nextDir.current = "right";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return nextDir;
}

function isWall(map: Tile[][], x: number, y: number): boolean {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (yi < 0 || yi >= ROWS) return true;
  const row = map[yi];
  if (xi < 0) return row[COLS - 1] === 1; // wrap check subtly considers walls
  if (xi >= COLS) return row[0] === 1;
  return row[xi] === 1 || row[xi] === 4; // gate is blocked for Pac-Man
}

function canMove(map: Tile[][], x: number, y: number, dir: Direction): boolean {
  const v = dirToVec(dir);
  const nx = x + Math.sign(v.x) * 0.5; // look ahead half tile
  const ny = y + Math.sign(v.y) * 0.5;
  return !isWall(map, nx, ny);
}

function ghostCanMove(map: Tile[][], x: number, y: number, dir: Direction): boolean {
  const v = dirToVec(dir);
  const nx = x + Math.sign(v.x) * 0.5;
  const ny = y + Math.sign(v.y) * 0.5;
  const xi = Math.round(nx);
  const yi = Math.round(ny);
  if (yi < 0 || yi >= ROWS) return false;
  const row = map[yi];
  const tile = row[(xi + COLS) % COLS];
  // Ghosts can go through gate (4) unless frightened
  return tile !== 1;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function initGhosts(): Ghost[] {
  return [
    { name: "blinky", color: "#ff4d4f", dir: "left", pos: { x: 14, y: 11 }, speed: GHOST_SPEED, mode: "chase", frightUntil: 0 },
    { name: "pinky", color: "#ff87c5", dir: "right", pos: { x: 13, y: 14 }, speed: GHOST_SPEED, mode: "chase", frightUntil: 0 },
    { name: "inky", color: "#00e5ff", dir: "up", pos: { x: 14, y: 14 }, speed: GHOST_SPEED, mode: "chase", frightUntil: 0 },
    { name: "clyde", color: "#ffb347", dir: "down", pos: { x: 15, y: 14 }, speed: GHOST_SPEED, mode: "chase", frightUntil: 0 },
  ];
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const keysRef = useKeys();

  const [state, setState] = useState<GameStateData>({
    score: 0,
    lives: 3,
    level: 1,
    pelletsRemaining: 0,
    isPaused: false,
    isGameOver: false,
    isWin: false,
  });

  const mapRef = useRef<Tile[][]>(generatePellets(BASE_MAP));
  const pacRef = useRef({ x: 14, y: 23, dir: "left" as Direction, speed: INITIAL_SPEED });
  const ghostsRef = useRef<Ghost[]>(initGhosts());
  const lastTimeRef = useRef<number>(0);

  const resetPositions = useCallback(() => {
    pacRef.current = { x: 14, y: 23, dir: "left", speed: INITIAL_SPEED };
    ghostsRef.current = initGhosts();
  }, []);

  const restartLevel = useCallback(() => {
    mapRef.current = generatePellets(BASE_MAP);
    setState((s) => ({ ...s, pelletsRemaining: countPellets(mapRef.current), isGameOver: false, isWin: false }));
    resetPositions();
  }, [resetPositions]);

  useEffect(() => {
    setState((s) => ({ ...s, pelletsRemaining: countPellets(mapRef.current) }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p") {
        setState((s) => ({ ...s, isPaused: !s.isPaused }));
      } else if (e.key.toLowerCase() === "r") {
        restartLevel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restartLevel]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const loop = (t: number) => {
      const dt = lastTimeRef.current ? (t - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = t;

      update(dt);
      render(ctx);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const countPellets = (map: Tile[][]) => {
    let n = 0;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] === 2) n++;
      }
    }
    return n;
  };

  const update = (dt: number) => {
    if (state.isPaused || state.isGameOver || state.isWin) return;

    // Pac-Man input handling at tile centers
    const pac = pacRef.current;
    const map = mapRef.current;
    const desired = keysRef.current.current;
    if (desired !== "none") {
      // if we are near a tile center, we can turn if possible
      const nearCenter = Math.abs(pac.x - Math.round(pac.x)) < 0.15 && Math.abs(pac.y - Math.round(pac.y)) < 0.15;
      if (nearCenter && canMove(map, Math.round(pac.x), Math.round(pac.y), desired)) {
        pac.dir = desired;
      }
    }

    // Move Pac-Man
    const v = dirToVec(pac.dir);
    const nx = pac.x + v.x * pac.speed * dt;
    const ny = pac.y + v.y * pac.speed * dt;
    if (!isWall(map, nx, ny)) {
      pac.x = (nx + COLS) % COLS;
      pac.y = ny;
      if (pac.y < 0) pac.y = 0; // clamp vertical
      if (pac.y > ROWS - 1) pac.y = ROWS - 1;
    }

    // Eat pellets / power pellets
    const cx = Math.round(pac.x);
    const cy = Math.round(pac.y);
    const tile = map[cy][cx];
    if (tile === 2) {
      map[cy][cx] = 0 as Tile;
      setState((s) => ({ ...s, score: s.score + 10, pelletsRemaining: s.pelletsRemaining - 1 }));
    } else if (tile === 3) {
      map[cy][cx] = 0 as Tile;
      const until = Date.now() + FRIGHT_DURATION_MS;
      ghostsRef.current = ghostsRef.current.map((g) => ({ ...g, mode: "frightened", frightUntil: until }));
      setState((s) => ({ ...s, score: s.score + 50, pelletsRemaining: s.pelletsRemaining - 1 }));
    }

    // Win condition
    if (state.pelletsRemaining <= 0) {
      setState((s) => ({ ...s, isWin: true }));
      return;
    }

    // Update ghosts
    for (const g of ghostsRef.current) {
      if (g.mode === "frightened" && Date.now() > g.frightUntil) {
        g.mode = "chase";
      }
      // choose direction at intersections or when blocked
      const dirs: Direction[] = ["up", "down", "left", "right"];
      const valid = dirs.filter((d) => ghostCanMove(map, g.pos.x, g.pos.y, d) && opposite(d) !== g.dir);
      if (valid.length === 0 || !ghostCanMove(map, g.pos.x, g.pos.y, g.dir)) {
        // reverse if stuck
        g.dir = opposite(g.dir);
      } else if (isIntersection(map, g.pos.x, g.pos.y)) {
        if (g.mode === "frightened") {
          g.dir = randomChoice(valid);
        } else {
          // greedy choose the direction that minimizes distance to Pac-Man (simple AI)
          const best = valid.reduce((best, d) => {
            const vv = dirToVec(d);
            const cand = { x: g.pos.x + vv.x, y: g.pos.y + vv.y };
            const dist = distance(cand, pac);
            return dist < best.dist ? { d, dist } : best;
          }, { d: valid[0], dist: Infinity });
          g.dir = best.d;
        }
      }
      const gv = dirToVec(g.dir);
      g.pos.x = (g.pos.x + gv.x * g.speed * dt + COLS) % COLS;
      g.pos.y = Math.max(0, Math.min(ROWS - 1, g.pos.y + gv.y * g.speed * dt));

      // Collision with Pac-Man
      if (distance(g.pos, pac) < 0.6) {
        if (g.mode === "frightened") {
          setState((s) => ({ ...s, score: s.score + 200 }));
          // send ghost back to house center
          g.pos = { x: 14, y: 11 };
          g.dir = "left";
          g.mode = "chase";
        } else {
          // Pac-Man loses a life
          setState((s) => ({ ...s, lives: s.lives - 1 }));
          if (state.lives - 1 <= 0) {
            setState((s) => ({ ...s, isGameOver: true }));
          }
          resetPositions();
          break;
        }
      }
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    clear(ctx);
    drawWalls(ctx, mapRef.current);
    drawPellets(ctx, mapRef.current);
    const pac = pacRef.current;
    drawPacman(ctx, pac.x, pac.y, pac.dir);
    for (const g of ghostsRef.current) drawGhost(ctx, g);
    drawHUD(ctx, state.score, state.lives);

    if (state.isPaused || state.isGameOver || state.isWin) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      const msg = state.isGameOver ? "Game Over ? Press R" : state.isWin ? "You Win! ? Press R" : "Paused";
      ctx.fillText(msg, CANVAS_W / 2, CANVAS_H / 2);
      ctx.textAlign = "left";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <div className="scoreboard">
        <span className="badge">Level {state.level}</span>
        <button className="button" onClick={() => setState((s) => ({ ...s, isPaused: !s.isPaused }))}>{state.isPaused ? "Resume" : "Pause"}</button>
        <button className="button" onClick={() => restartLevel()}>Restart</button>
      </div>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
    </div>
  );
}

function isIntersection(map: Tile[][], x: number, y: number) {
  const options = ["up", "down", "left", "right"].filter((d) => ghostCanMove(map, x, y, d as Direction));
  return options.length >= 3;
}

function opposite(d: Direction): Direction {
  switch (d) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
    default:
      return "none";
  }
}

function canMove(map: Tile[][], x: number, y: number, dir: Direction): boolean {
  const v = dirToVec(dir);
  const nx = x + v.x;
  const ny = y + v.y;
  if (ny < 0 || ny >= ROWS) return false;
  const row = map[ny];
  const tile = row[(nx + COLS) % COLS];
  return tile !== 1 && tile !== 4;
}

function isWall(map: Tile[][], x: number, y: number): boolean {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (yi < 0 || yi >= ROWS) return true;
  const row = map[yi];
  const tile = row[(xi + COLS) % COLS];
  return tile === 1 || tile === 4;
}
