import { Chess } from "chess.js";

export function serializeGame(chess: Chess) {
  const pgn = chess.pgn();

  const state = chess.ascii().replace(/\n/g, "\n;");

  return `${pgn}

;${state}
`;
}
