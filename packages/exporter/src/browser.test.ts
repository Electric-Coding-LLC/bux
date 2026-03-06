import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { createExportBundleFiles } from "@bux/exporter/browser";

describe("browser entry", () => {
  it("exposes the pure export bundle helpers without node-only APIs", () => {
    const files = createExportBundleFiles(canonicalProjectFixture);

    expect(files["tokens.json"]).toContain('"schemaVersion": "1.0.0"');
    expect(files["summary.json"]).toContain('"targetProfile": "portable-core"');
  });
});
