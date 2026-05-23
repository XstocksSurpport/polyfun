import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const port = 3000;
const root = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(root, "..", "app");

function killPortWindows(p) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${p} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
      { encoding: "utf8" }
    ).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/).filter(Boolean)) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

killPortWindows(port);

function removeNextDir(dir) {
  if (!existsSync(dir)) return;
  console.log("Removing stale .next cache…");
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return;
    } catch (err) {
      if (attempt === 4) throw err;
      try {
        execSync(`powershell -NoProfile -Command "Remove-Item -LiteralPath '${dir.replace(/'/g, "''")}' -Recurse -Force -ErrorAction Stop"`, {
          stdio: "ignore",
        });
        return;
      } catch {
        // locked by a running Next process — retry after killPort
      }
    }
  }
}

const nextDir = path.join(appDir, ".next");
if (process.argv.includes("--clean")) {
  removeNextDir(nextDir);
}

console.log(`Starting dev server at http://localhost:${port}`);

const child = spawn("npm", ["run", "dev"], {
  cwd: appDir,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
