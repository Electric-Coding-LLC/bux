import type { JSONValue, SectionNode, SectionType } from "@bux/core-model";

export type SectionDraft = Omit<SectionNode, "id">;

function defaultFeatureItems() {
  return [
    {
      title: "Feature one",
      body: "System-level foundation with constrained controls."
    },
    {
      title: "Feature two",
      body: "Portable model structure for adapters."
    },
    {
      title: "Feature three",
      body: "Deterministic export artifacts."
    }
  ] satisfies JSONValue[];
}

export function createSectionDraft(type: SectionType): SectionDraft {
  switch (type) {
    case "hero":
      return {
        type: "hero",
        variant: "split",
        props: {
          align: "start",
          ctaCount: 2,
          hasMedia: true
        },
        slots: {
          eyebrow: "System baseline",
          heading: "A section ready for iteration",
          body: "Use constrained controls to shape this hero.",
          primaryCta: "Primary action",
          secondaryCta: "Secondary action"
        }
      };
    case "featureGrid":
      return {
        type: "featureGrid",
        variant: "cards",
        props: {
          columns: 3,
          showIcons: true
        },
        slots: {
          heading: "Feature grid",
          items: defaultFeatureItems()
        }
      };
    case "form":
      return {
        type: "form",
        variant: "stacked",
        props: {
          layout: "stacked"
        },
        slots: {
          heading: "Contact details",
          fields: ["Name", "Email", "Company", "Message"],
          submitLabel: "Submit"
        }
      };
    case "list":
      return {
        type: "list",
        variant: "simple",
        props: {},
        slots: {
          heading: "Recent activity",
          items: [
            "Updated typography scale",
            "Reordered feature section",
            "Exported deterministic bundle"
          ]
        }
      };
    case "table":
      return {
        type: "table",
        variant: "comfortable",
        props: {
          columns: 4
        },
        slots: {
          heading: "Usage metrics",
          headers: ["Name", "Status", "Owner", "Updated"],
          rows: [
            ["Homepage", "Ready", "Design", "Today"],
            ["Settings", "Draft", "Product", "Today"],
            ["Dashboard", "Review", "Engineering", "Yesterday"]
          ]
        }
      };
    case "settings":
      return {
        type: "settings",
        variant: "grouped",
        props: {
          groupCount: 3
        },
        slots: {
          heading: "Workspace settings",
          groups: ["Appearance", "Notifications", "Access controls"]
        }
      };
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}
