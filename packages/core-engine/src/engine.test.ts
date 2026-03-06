import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import {
  applyAction,
  applyActions,
  type EngineAction,
  generateSectionId
} from "./engine";

function getProject() {
  return structuredClone(canonicalProjectFixture);
}

describe("generateSectionId", () => {
  it("increments based on existing section ids for a type", () => {
    const next = generateSectionId("featureGrid", canonicalProjectFixture.page.sections);
    expect(next).toBe("sec-feature-grid-002");
  });
});

describe("applyAction", () => {
  it("adds section with deterministic id and updates summary", () => {
    const next = applyAction(getProject(), {
      type: "addSection",
      index: 1,
      section: {
        type: "list",
        variant: "simple",
        props: { showAvatars: false },
        slots: {
          heading: "Recent events",
          items: ["One", "Two"]
        }
      }
    });

    expect(next.page.sections[1]?.id).toBe("sec-list-001");
    expect(next.summary.layout.sectionCount).toBe(3);
    expect(next.summary.layout.sectionOrder).toEqual(["hero", "list", "featureGrid"]);
  });

  it("reorders sections by id", () => {
    const next = applyAction(getProject(), {
      type: "reorderSection",
      sectionId: "sec-feature-grid-001",
      toIndex: 0
    });

    expect(next.page.sections[0]?.id).toBe("sec-feature-grid-001");
    expect(next.page.sections[1]?.id).toBe("sec-hero-001");
    expect(next.summary.layout.sectionOrder).toEqual(["featureGrid", "hero"]);
  });

  it("updates section props and slots with shallow merge", () => {
    const next = applyAction(getProject(), {
      type: "updateSection",
      sectionId: "sec-hero-001",
      changes: {
        props: { align: "center" },
        slots: { heading: "Updated heading" }
      }
    });

    const hero = next.page.sections.find((section) => section.id === "sec-hero-001");
    expect(hero?.props.align).toBe("center");
    expect(hero?.slots.heading).toBe("Updated heading");
    expect(hero?.slots.primaryCta).toBe("Start from baseline");
  });

  it("updates section rules and supports clearing maxItems", () => {
    const next = applyAction(getProject(), {
      type: "updateSectionRule",
      sectionType: "hero",
      changes: {
        allowedVariants: ["split", "stacked"],
        maxItems: null
      }
    });

    const rule = next.constraints.sectionRules.find((entry) => entry.sectionType === "hero");
    expect(rule?.allowedVariants).toEqual(["split", "stacked"]);
    expect(rule && "maxItems" in rule).toBe(false);
  });

  it("updates token values and recomputes summary metadata", () => {
    const next = applyAction(getProject(), {
      type: "setTokenValue",
      path: ["colors", "roles", "text.tertiary"],
      value: "#6B7280"
    });

    expect(next.tokens.colors.roles["text.tertiary"]).toBe("#6B7280");
    expect(next.summary.system.colorRoleCount).toBe(7);
  });

  it("updates constraint values and recomputes summary metadata", () => {
    const next = applyAction(getProject(), {
      type: "setConstraintValue",
      path: ["layout", "defaultDensity"],
      value: "compact"
    });

    expect(next.constraints.layout.defaultDensity).toBe("compact");
    expect(next.summary.system.defaultDensity).toBe("compact");
  });

  it("removes sections by id", () => {
    const next = applyAction(getProject(), {
      type: "removeSection",
      sectionId: "sec-feature-grid-001"
    });

    expect(next.page.sections).toHaveLength(1);
    expect(next.summary.layout.sectionCount).toBe(1);
    expect(next.summary.layout.sectionOrder).toEqual(["hero"]);
  });

  it("sets stress modes and mirrors them into summary metadata", () => {
    const next = applyAction(getProject(), {
      type: "setStressMode",
      mode: "stateMode",
      value: "loading"
    });

    expect(next.stress.stateMode).toBe("loading");
    expect(next.summary.stress.stateMode).toBe("loading");
  });
});

describe("applyActions", () => {
  const actions: EngineAction[] = [
    {
      type: "setTokenValue",
      path: ["spacing", "density", "compact"],
      value: 0.75
    },
    {
      type: "addSection",
      section: {
        id: "sec-settings-001",
        type: "settings",
        variant: "grouped",
        props: { groupCount: 3 },
        slots: { heading: "Preferences" }
      }
    }
  ];

  it("is deterministic for identical input + action sequence", () => {
    const first = applyActions(getProject(), [...actions], {
      generatedAt: "2026-02-26T12:00:00.000Z"
    });
    const second = applyActions(getProject(), [...actions], {
      generatedAt: "2026-02-26T12:00:00.000Z"
    });

    expect(first).toEqual(second);
  });

  it("honors provided summary timestamp override", () => {
    const next = applyActions(
      getProject(),
      [
        ...actions,
        {
          type: "setStressMode",
          mode: "copyMode",
          value: "long"
        }
      ],
      {
      generatedAt: "2026-02-26T12:00:00.000Z"
      }
    );

    expect(next.summary.generatedAt).toBe("2026-02-26T12:00:00.000Z");
    expect(next.summary.layout.sectionOrder).toContain("settings");
    expect(next.summary.stress.copyMode).toBe("long");
  });
});

describe("errors", () => {
  it("throws when trying to reuse an existing section id", () => {
    expect(() =>
      applyAction(getProject(), {
        type: "addSection",
        section: {
          id: "sec-hero-001",
          type: "hero",
          variant: "centered",
          props: {},
          slots: {}
        }
      })
    ).toThrow('Section with id "sec-hero-001" already exists.');
  });

  it("throws for non-existent token path segment", () => {
    expect(() =>
      applyAction(getProject(), {
        type: "setTokenValue",
        path: ["spacing", "unknown", "value"],
        value: 42
      })
    ).toThrow('Token path segment "unknown" does not exist.');
  });

  it("throws for non-existent constraint path segment", () => {
    expect(() =>
      applyAction(getProject(), {
        type: "setConstraintValue",
        path: ["layout", "unknown", "value"],
        value: 42
      })
    ).toThrow('Constraint path segment "unknown" does not exist.');
  });

  it("throws for unknown section rule type", () => {
    expect(() =>
      applyAction(getProject(), {
        type: "updateSectionRule",
        sectionType: "hero",
        changes: {
          allowedVariants: ["split"]
        }
      })
    )
      .not.toThrow();

    const project = getProject();
    project.constraints.sectionRules = project.constraints.sectionRules.filter(
      (entry) => entry.sectionType !== "hero"
    );

    expect(() =>
      applyAction(project, {
        type: "updateSectionRule",
        sectionType: "hero",
        changes: {
          allowedVariants: ["split"]
        }
      })
    ).toThrow('Section rule for type "hero" was not found.');
  });
});
