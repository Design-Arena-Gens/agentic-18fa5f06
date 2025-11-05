import { TILE_SIZE, CANVAS_W, CANVAS_H } from "./logic";
import type { Ghost } from "./types";
import type { Tile } from "./types";

export function clear(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
}

export function drawWalls(ctx: CanvasRenderingContext2D, map: Tile[][]) {
  ctx.strokeStyle = "#1e90ff";
  ctx.lineWidth = 2.5;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === 1) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }
  }
}

export function drawPellets(ctx: CanvasRenderingContext2D, map: Tile[][]) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const t = map[y][x];
      if (t === 2 || t === 3) {
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        ctx.beginPath();
        const r = t === 3 ? 4 : 2;
        ctx.fillStyle = t === 3 ? "#ffd966" : "#ffe9b3";
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function drawPacman(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: string) {
  const px = cx * TILE_SIZE + TILE_SIZE / 2;
  const py = cy * TILE_SIZE + TILE_SIZE / 2;
  const r = TILE_SIZE * 0.42;
  const t = Math.sin(Date.now() / 100) * 0.25 + 0.35; // mouth animation
  const angles: Record<string, [number, number]> = {
    right: [-t, t],
    left: [Math.PI - t, Math.PI + t],
    up: [1.5 * Math.PI - t, 1.5 * Math.PI + t],
    down: [0.5 * Math.PI - t, 0.5 * Math.PI + t],
    none: [-t, t],
  };
  const [a1, a2] = angles[dir] ?? angles.right;
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, r, a1, a2);
  ctx.closePath();
  ctx.fill();
}

export function drawGhost(ctx: CanvasRenderingContext2D, g: Ghost) {
  const px = g.pos.x * TILE_SIZE + TILE_SIZE / 2;
  const py = g.pos.y * TILE_SIZE + TILE_SIZE / 2;
  const r = TILE_SIZE * 0.4;
  const color = g.mode === "frightened" ? "#3b82f6" : g.color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py - r * 0.2, r, Math.PI, 0);
  ctx.lineTo(px + r, py + r * 0.6);
  ctx.quadraticCurveTo(px + r * 0.4, py + r * 0.2, px, py + r * 0.6);
  ctx.quadraticCurveTo(px - r * 0.4, py + r * 0.2, px - r, py + r * 0.6);
  ctx.closePath();
  ctx.fill();
  // eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(px - r * 0.3, py - r * 0.1, r * 0.22, 0, Math.PI * 2);
  ctx.arc(px + r * 0.3, py - r * 0.1, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHUD(ctx: CanvasRenderingContext2D, score: number, lives: number) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, CANVAS_H - 24, CANVAS_W, 24);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px ui-sans-serif, system-ui";
  ctx.fillText(`Score: ${score}`, 8, CANVAS_H - 8);
  ctx.fillText(`Lives: ${lives}`, CANVAS_W - 90, CANVAS_H - 8);
}
