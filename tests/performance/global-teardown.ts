import { execFileSync } from "node:child_process";

export default function globalTeardown() {
  execFileSync(process.execPath, ["scripts/clean-perf-port.mjs"], {
    stdio: "ignore",
    windowsHide: true,
  });
}
