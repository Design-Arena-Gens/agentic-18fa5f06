"use client";

import dynamic from "next/dynamic";
import React from "react";

const Game = dynamic(() => import("./pacman/Game"), { ssr: false });

export default function Page() {
  return (
    <main>
      <div className="container">
        <h1 className="title">Pac?Man</h1>
        <div className="info">Arrow keys or WASD to move ? P to pause ? R to restart</div>
        <Game />
      </div>
    </main>
  );
}
