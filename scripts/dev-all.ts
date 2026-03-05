import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface Service {
  name: string;
  cwd: string;
  command: string[];
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "..");

const services: Service[] = [
  {
    name: "playground",
    cwd: resolve(repoRoot, "apps/playground"),
    command: ["bun", "run", "dev"]
  },
  {
    name: "mcp",
    cwd: resolve(repoRoot, "apps/mcp-server"),
    command: ["bun", "run", "start"]
  }
];

const children = services.map((service) => ({
  service,
  child: Bun.spawn(service.command, {
    cwd: service.cwd,
    env: process.env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  })
}));

let isShuttingDown = false;

async function shutdown(exitCode: number): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const { child } of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // Ignore failures from already-exited children.
    }
  }

  await Promise.race([
    Promise.allSettled(children.map(({ child }) => child.exited)),
    Bun.sleep(1_500)
  ]);

  for (const { child } of children) {
    try {
      child.kill("SIGKILL");
    } catch {
      // Ignore failures from already-exited children.
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

const exits = children.map(({ child, service }) =>
  child.exited.then((code) => ({ name: service.name, code }))
);

const firstExit = await Promise.race(exits);

if (!isShuttingDown) {
  const code = firstExit.code === 0 ? 1 : firstExit.code;
  const detail =
    firstExit.code === 0
      ? "exited unexpectedly."
      : `exited with code ${String(firstExit.code)}.`;
  console.error(`[dev:all] ${firstExit.name} ${detail}`);
  await shutdown(code);
}
