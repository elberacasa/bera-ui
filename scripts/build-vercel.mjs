import { spawnSync } from "node:child_process";
import "./sync-components.mjs";

const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      BERA_BUILD_TARGET: "vercel",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
