import { parseArgs as _parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";
import { Chess } from "chess.js";
import { GAMES_DIRECTORY } from "./constants";
import { serializeGame } from "./serialize-game";
import { commitGame } from "./commit-game";

function parseEnvVars() {
  const gameId = process.env["GAME_ID"];
  const githubActor = process.env["GITHUB_ACTOR"];
  const move = process.env["MOVE"];

  if (gameId === undefined) {
    throw new Error("GAME_ID is not set");
  }

  if (githubActor === undefined) {
    throw new Error("GITHUB_ACTOR is not set");
  }

  if (move === undefined) {
    throw new Error("MOVE is not set");
  }

  return {
    gameId,
    githubActor,
    move,
  };
}

async function main() {
  const isCI = process.env["CI"] === "true";

  const { gameId, githubActor, move } = parseEnvVars();

  const gameFilepath = path.join(GAMES_DIRECTORY, `${gameId}.pgn`);

  const initialPgn = await fs.promises.readFile(gameFilepath, {
    encoding: "utf8",
  });

  const chess = new Chess();
  chess.loadPgn(initialPgn);
  chess.deleteComment();

  const turn = chess.turn();

  const playerToPlay = chess.header()[turn === "w" ? "White" : "Black"];

  if (playerToPlay !== githubActor) {
    throw new Error(`It's ${playerToPlay}'s turn, not ${githubActor}'s`);
  }

  chess.move(move);

  const fileContent = serializeGame(chess);

  await fs.promises.writeFile(gameFilepath, fileContent, { encoding: "utf-8" });

  if (isCI) {
    commitGame({ gameFilepath, gameId });
  }
}
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
