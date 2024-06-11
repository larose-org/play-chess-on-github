# Play Chess on GitHub

Yes, you read that right; you can now play chess on GitHub.

## Getting Started

### Creating a New Game

- Run the "Create Game" workflow.
- Enter the GitHub usernames for both players. You can even challenge the Stockfish chess engine by entering `<stockfish>` as a username.
- After the workflow runs successfully, a new file will be created in the [`games`](games) directory. The game's ID is its filename without the extension. For instance: `games/20240611T014814451Z.pgn` -> `20240611T014814451Z`.

### Making a Move

- Run the "Make Move" workflow.
- Enter the game ID and your move using [Algebric Notation](<https://en.wikipedia.org/wiki/Algebraic_notation_(chess)>). Both short and long (e.g., `e2e4`) algebraic notations are accepted.

## Why Was This Created?

There's absolutely no reason for this project to exist in the universe, yet here it is.
