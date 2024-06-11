import fs from "node:fs";
import process from "node:process";
import { Chess } from "chess.js";
import path from "node:path";
import { parse } from "@mliebelt/pgn-parser";

async function main() {
  const game = new Chess();

  const filename = path.join(
    __dirname,
    "..",
    "games",
    // "20240609T15100100Z.pgn"
    "20240609T193401550Z.pgn"
  );

  const pgnContent = await fs.promises.readFile(filename, {
    encoding: "utf-8",
  });

  // const foo = parse(pgnContent, { startRule: "game" });

  // console.log(JSON.stringify(foo, null,2 ));
  game.loadPgn(pgnContent);

  console.log(game.ascii());

  // console.log("game.isGameOver() =", game.is());

  console.log("game.isCheck() =", game.isCheck());
  console.log("game.moves() =", game.moves());
  // console.log("game.history() =", game.history());
  console.log("game.isGameOver() =", game.isGameOver());
  console.log("game.header() =", game.header());
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
