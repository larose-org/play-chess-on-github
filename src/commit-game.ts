import { execSync } from "child_process";

export function commitGame({
  gameFilepath,
  gameId,
}: {
  gameFilepath: string;
  gameId: string;
}) {
  execSync('git config user.email ""', { stdio: "inherit" });
  execSync('git config user.name "Bot"', {
    stdio: "inherit",
  });
  execSync(`git add ${gameFilepath}`, { stdio: "inherit" });
  execSync(`git commit -m "Update game ${gameId}"`, { stdio: "inherit" });
  execSync("git push origin", { stdio: "inherit" });
}
