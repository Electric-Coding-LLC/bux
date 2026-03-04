import { createInterface } from "node:readline";
import { executeToolRequest } from "./tools";

async function main(): Promise<void> {
  const lineReader = createInterface({
    input: process.stdin,
    crlfDelay: Infinity
  });

  for await (const rawLine of lineReader) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    let envelope: unknown;

    try {
      envelope = JSON.parse(line);
    } catch (error: unknown) {
      const response = {
        id: null,
        contractVersion: "1.0.0",
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: "Input is not valid JSON.",
          details: error instanceof Error ? error.message : "unknown"
        }
      };
      process.stdout.write(`${JSON.stringify(response)}\n`);
      continue;
    }

    const response = await executeToolRequest(
      typeof envelope === "object" && envelope !== null
        ? (envelope as { id?: string | number | null; tool?: unknown; input?: unknown })
        : {}
    );
    process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

main().catch((error: unknown) => {
  const response = {
    id: null,
    contractVersion: "1.0.0",
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "MCP server crashed.",
      details: error instanceof Error ? error.message : "unknown"
    }
  };
  process.stdout.write(`${JSON.stringify(response)}\n`);
  process.exit(1);
});
