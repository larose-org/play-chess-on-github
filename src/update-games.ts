import { parseArgs as _parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "child_process";
import { Chess } from "chess.js";
import { GAMES_DIRECTORY, STOCKFISH_USERNAME } from "./constants";
import { commitGame } from "./commit-game";
import { serializeGame } from "./serialize-game";

async function getBestMove({
  fen,
  stockfishPath,
}: {
  fen: string;
  stockfishPath: string;
}) {
  return new Promise<string>((resolve, reject) => {
    const stockfish = spawn(stockfishPath);

    let bestMove: string | undefined;

    stockfish.stdout.on("data", (data) => {
      const output = data.toString();
      if (output.includes("bestmove")) {
        const match = output.match(/bestmove\s(\w+)/);
        if (match) {
          bestMove = match[1];
          stockfish.stdin.write("quit\n");
        }
      }
    });

    stockfish.stderr.on("data", (data) => {
      console.error(data.toString());
      stockfish.kill();
    });

    stockfish.on("close", (code) => {
      if (code !== 0) {
        reject(`Stockfish process exited with code ${code}`);
      }

      if (bestMove === undefined) {
        throw new Error(`bestMove is undefined`);
      }

      resolve(bestMove);
    });

    stockfish.stdin.write("uci\n");
    stockfish.stdin.write(`position fen ${fen}\n`);
    stockfish.stdin.write("go movetime 5000\n");
  });
}

async function _processGame({
  chess,
  stockfishPath,
}: {
  chess: Chess;
  stockfishPath: string;
}): Promise<boolean> {
  chess.deleteComment();

  if (chess.isGameOver() || chess.header()["Result"] !== undefined) {
    return false;
  }

  const turn = chess.turn();

  const playerToPlay = chess.header()[turn === "w" ? "White" : "Black"];

  if (playerToPlay !== STOCKFISH_USERNAME) {
    return false;
  }

  const move = await getBestMove({ fen: chess.fen(), stockfishPath });

  chess.move(move);

  return true;
}

async function processGame({
  isCI,
  gameId,
  stockfishPath,
}: {
  isCI: boolean;
  gameId: string;
  stockfishPath: string;
}) {
  const gameFilepath = path.join(GAMES_DIRECTORY, `${gameId}.pgn`);

  const initialPgn = await fs.promises.readFile(gameFilepath, {
    encoding: "utf8",
  });

  const chess = new Chess();
  chess.loadPgn(initialPgn);

  const updated = await _processGame({ chess, stockfishPath });

  if (updated) {
    const fileContent = serializeGame(chess);

    await fs.promises.writeFile(gameFilepath, fileContent, {
      encoding: "utf-8",
    });

    if (isCI) {
      commitGame({ gameFilepath, gameId });
    }
  }
}

async function main() {
  const isCI = process.env["CI"] === "true";
  const stockfishPath = process.env["STOCKFISH"];

  if (stockfishPath === undefined) {
    throw new Error("STOCKFISH is not set");
  }

  const filenames = await fs.promises.readdir(GAMES_DIRECTORY);

  let hasError = false;

  for (const filename of filenames) {
    const gameId = filename.replace(".pgn", "");

    try {
      await processGame({ isCI, gameId, stockfishPath });
    } catch (error: unknown) {
      hasError = true;
      console.error(error);
    }
  }

  if (hasError) {
    throw Error("Script failed with an error");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
