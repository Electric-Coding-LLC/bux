import { describe, expect, it } from "bun:test";
import { createSectionDraft } from "./section-templates";

describe("createSectionDraft", () => {
  it("returns a valid hero section draft", () => {
    const draft = createSectionDraft("hero");
    expect(draft.type).toBe("hero");
    expect(draft.props.ctaCount).toBe(2);
    expect(draft.variant).toBe("split");
  });

  it("returns a draft for each v1 section type", () => {
    const types = [
      "hero",
      "featureGrid",
      "form",
      "list",
      "table",
      "settings"
    ] as const;

    for (const type of types) {
      const draft = createSectionDraft(type);
      expect(draft.type).toBe(type);
      expect(typeof draft.variant).toBe("string");
      expect(draft.variant.length).toBeGreaterThan(0);
    }
  });
});
