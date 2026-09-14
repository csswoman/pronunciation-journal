import { execFileSync } from "node:child_process";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

function listeningPidsOnPort(port) {
  const output = execFileSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
    windowsHide: true,
  });

  return output
    .split(/\r?\n/)
    .filter((line) => line.includes("LISTENING"))
    .map((line) => line.trim().split(/\s+/))
    .filter((columns) => columns[1]?.endsWith(`:${port}`))
    .map((columns) => Number(columns.at(-1)))
    .filter(Number.isSafeInteger);
}

if (process.platform === "win32") {
  for (const pid of listeningPidsOnPort(PORT)) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process may already have exited or be owned by another user.
    }
  }
}
