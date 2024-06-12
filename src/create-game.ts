import { parseArgs as _parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";
import { Chess } from "chess.js";
import { GAMES_DIRECTORY, STOCKFISH_USERNAME } from "./constants";

function isValidGithubUsernameOrStockfish(username: string): boolean {
  const pattern: RegExp = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return pattern.test(username) || username === STOCKFISH_USERNAME;
}

function getCurrentTimestamp(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  const milliSeconds = String(now.getUTCMilliseconds()).padStart(3, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}${milliSeconds}Z`;
}

function parsePlayerUsernames(input: string) {
  const regex = /^\s*(.*?)\s*vs\s*(.*?)\s*$/i;
  const match = input.match(regex);

  if (match === null) {
    throw new Error("Invalid title");
  }

  const [, whiteUsername, blackUsername] = match;
  return { whiteUsername, blackUsername };
}

function parseEnvVars() {
  const discussionId = process.env["DISCUSSION_ID"];
  const discussionTitle = process.env["DISCUSSION_TITLE"];
  const githubToken = process.env["GITHUB_TOKEN"];

  if (discussionId === undefined) {
    throw new Error("DISCUSSION_ID is not set");
  }

  if (discussionTitle === undefined) {
    throw new Error("DISCUSSION_TITLE is not set");
  }

  if (githubToken === undefined) {
    throw new Error("GITHUB_TOKEN is not set");
  }

  const { blackUsername, whiteUsername } =
    parsePlayerUsernames(discussionTitle);

  if (!isValidGithubUsernameOrStockfish(blackUsername)) {
    throw new Error("Invalid black username");
  }

  if (!isValidGithubUsernameOrStockfish(whiteUsername)) {
    throw new Error("Invalid white username");
  }

  if (blackUsername === whiteUsername) {
    throw new Error(`${blackUsername} can't play against themselves`);
  }

  return {
    blackUsername,
    discussionId,
    whiteUsername,
  };
}

// function parseEnvVars() {
//   const blackUsername = process.env["BLACK_USERNAME"];
//   const whiteUsername = process.env["WHITE_USERNAME"];

//   if (blackUsername === undefined) {
//     throw new Error("BLACK_USERNAME is not set");
//   }

//   if (!isValidGithubUsernameOrStockfish(blackUsername)) {
//     throw new Error("Invalid BLACK_USERNAME");
//   }

//   if (whiteUsername === undefined) {
//     throw new Error("WHITE_USERNAME is not set");
//   }

//   if (!isValidGithubUsernameOrStockfish(whiteUsername)) {
//     throw new Error("Invalid WHITE_USERNAME");
//   }

//   if (blackUsername === whiteUsername) {
//     throw new Error(`${blackUsername} can't play against themselves`);
//   }

//   return {
//     blackUsername,
//     whiteUsername,
//   };
// }

async function main() {
  const isCI = process.env["CI"] === "true";

  const { blackUsername, discussionId, whiteUsername } = parseEnvVars();

  await fs.promises.mkdir(GAMES_DIRECTORY, { recursive: true });

  const gameFilepath = path.join(GAMES_DIRECTORY, `${discussionId}.pgn`);

  const gameFilehandle = await fs.promises.open(gameFilepath, "w");

  const chess = new Chess();

  const state = chess.ascii().replace(/\n/g, "\n;");

  gameFilehandle.write(`[White "${whiteUsername}"]
[Black "${blackUsername}"]

;${state}
`);

  gameFilehandle.close();

  if (isCI) {
    execSync('git config user.email ""', { stdio: "inherit" });
    execSync('git config user.name "Bot"', {
      stdio: "inherit",
    });

    execSync(`git add ${gameFilepath}`, { stdio: "inherit" });

    execSync(
      `git commit -m "Create game ${gameId} (${whiteUsername} vs ${blackUsername})"`,
      { stdio: "inherit" }
    );

    execSync("git push origin", { stdio: "inherit" });
  }
}
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
