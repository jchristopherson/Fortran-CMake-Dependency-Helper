import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as cp from "child_process";

export async function autoDetectPackageName(repoUrl: string): Promise<string | undefined> {
  const tmp = path.join(os.tmpdir(), "fortranDeps-" + Date.now());

  try {
    await gitCloneShallow(repoUrl, tmp);

    const files = fs.readdirSync(tmp);

    const config = files.find(f => f.endsWith("Config.cmake"));
    if (config) return config.replace("Config.cmake", "");

    const find = files.find(f => f.startsWith("Find") && f.endsWith(".cmake"));
    if (find) return find.replace("Find", "").replace(".cmake", "");

    return undefined;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function gitCloneShallow(repo: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = cp.spawn("git", ["clone", "--depth", "1", repo, dest]);

    proc.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error("Git clone failed"));
    });
  });
}
