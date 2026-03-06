import {
  CURRENT_SCHEMA_VERSION,
  type MarketingLandingScreenBrief,
  type PageDocument,
  type SectionNode
} from "@bux/core-model";
import type { MarketingLandingBlueprint } from "../types";

function heroSection(
  id: string,
  options: {
    body: string;
    ctaCount: 1 | 2;
    eyebrow: string;
    hasMedia?: boolean;
    heading: string;
    primaryCta: string;
    secondaryCta?: string;
    variant: "centered" | "split" | "stacked";
  }
): SectionNode {
  const slots: SectionNode["slots"] = {
    body: options.body,
    eyebrow: options.eyebrow,
    heading: options.heading,
    primaryCta: options.primaryCta
  };

  if (options.secondaryCta !== undefined) {
    slots.secondaryCta = options.secondaryCta;
  }

  return {
    id,
    type: "hero",
    variant: options.variant,
    props: {
      align: "start",
      ctaCount: options.ctaCount,
      hasMedia: options.hasMedia ?? false
    },
    slots
  };
}

function featureGridSection(
  id: string,
  options: {
    heading: string;
    items: Array<{ title: string; body: string }>;
    variant: "cards" | "minimal";
  }
): SectionNode {
  return {
    id,
    type: "featureGrid",
    variant: options.variant,
    props: {
      columns: Math.min(4, Math.max(2, options.items.length)),
      showIcons: options.variant === "cards"
    },
    slots: {
      heading: options.heading,
      items: options.items
    }
  };
}

function listSection(
  id: string,
  options: {
    heading: string;
    items: string[];
    variant: "detailed" | "simple";
  }
): SectionNode {
  return {
    id,
    type: "list",
    variant: options.variant,
    props: {},
    slots: {
      heading: options.heading,
      items: options.items
    }
  };
}

function formSection(
  id: string,
  options: {
    fields: string[];
    heading: string;
    submitLabel: string;
    variant: "inline" | "stacked";
  }
): SectionNode {
  return {
    id,
    type: "form",
    variant: options.variant,
    props: {
      layout: options.variant
    },
    slots: {
      fields: options.fields,
      heading: options.heading,
      submitLabel: options.submitLabel
    }
  };
}

function page(title: string, sections: SectionNode[]): PageDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title,
    sections
  };
}

const marketingBlueprintDefinitions: MarketingLandingBlueprint[] = [
  {
    id: "signal-stack",
    screenType: "marketingLanding",
    name: "Signal Stack",
    description:
      "Lead with a sharp product claim, follow with structured proof, and end on one clear conversion block.",
    hierarchyIntent:
      "Establish one dominant promise, then stack supporting proof in descending order of importance.",
    densityEnvelope: ["focused", "launch"],
    ctaStrategy:
      "Keep the hero CTA dominant and let the final form act as the only second commitment point.",
    allowedVariants: ["split", "minimal", "stacked"],
    antiPatternNotes: [
      "Do not bury the lead under equal-weight support sections.",
      "Do not introduce operational dashboard chrome into the landing narrative."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Show what changes for the buyer immediately, then move into concrete product proof before asking for the next step.",
          ctaCount: 1,
          eyebrow: "Product launch",
          hasMedia: true,
          heading: brief.title,
          primaryCta: "Book a demo",
          variant: "split"
        }),
        featureGridSection("sec-feature-grid-001", {
          heading: "Why the product feels different",
          items: [
            {
              title: "Clear operational baseline",
              body: "Replace guesswork with one opinionated system instead of scattered setup debt."
            },
            {
              title: "Faster path to production",
              body: "Move from intent to an approved direction without long correction loops."
            },
            {
              title: "Deterministic output",
              body: "Keep quality repeatable across generation, review, and export."
            }
          ],
          variant: "minimal"
        }),
        formSection("sec-form-001", {
          fields: ["Work email", "Company", "Team size"],
          heading: "See it with your team",
          submitLabel: "Request demo",
          variant: "stacked"
        })
      ])
  },
  {
    id: "proof-arc",
    screenType: "marketingLanding",
    name: "Proof Arc",
    description:
      "A narrative landing page that moves from promise to proof points to a short conversion ask.",
    hierarchyIntent:
      "Keep the story linear so each section earns the next rather than competing for equal attention.",
    densityEnvelope: ["editorial", "focused"],
    ctaStrategy:
      "Use a two-step CTA hierarchy in the hero, then avoid repeating competing actions in the support sections.",
    allowedVariants: ["stacked", "cards", "simple"],
    antiPatternNotes: [
      "Do not flatten the story into a generic feature dump.",
      "Do not add multiple forms or repeated CTA bars."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Open with the product angle, support it with proof, and give buyers one obvious next action once the story lands.",
          ctaCount: 2,
          eyebrow: "Narrative first",
          heading: brief.title,
          primaryCta: "Start evaluation",
          secondaryCta: "Read the brief",
          variant: "stacked"
        }),
        featureGridSection("sec-feature-grid-001", {
          heading: "Proof points",
          items: [
            {
              title: "Explicit taste bar",
              body: "The system encodes what strong structure looks like before anything ships."
            },
            {
              title: "Fewer revision loops",
              body: "Weak candidates are rejected or repaired before they get human approval time."
            },
            {
              title: "Portable model",
              body: "The same constrained model survives preview, export, and downstream adapters."
            }
          ],
          variant: "cards"
        }),
        listSection("sec-list-001", {
          heading: "What teams stop wasting time on",
          items: [
            "Repeated prompt corrections to fix weak hierarchy",
            "Manual cleanup of filler wrappers and generic chrome",
            "Debates over whether a candidate is good enough to ship"
          ],
          variant: "simple"
        })
      ])
  },
  {
    id: "conversion-rail",
    screenType: "marketingLanding",
    name: "Conversion Rail",
    description:
      "A tighter launch page with a hero, a compact proof surface, and a direct inline conversion ask.",
    hierarchyIntent:
      "Bias the page toward activation quickly while keeping enough proof to justify the CTA.",
    densityEnvelope: ["launch", "focused"],
    ctaStrategy:
      "Keep one hero CTA and one compact inline form as the only conversion moments on the page.",
    allowedVariants: ["centered", "minimal", "inline"],
    antiPatternNotes: [
      "Do not insert extra explainer sections between proof and the form.",
      "Do not turn the conversion area into a full multi-step onboarding flow."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Keep the story short, validate the promise quickly, and move straight into the conversion ask.",
          ctaCount: 1,
          eyebrow: "Launch page",
          heading: brief.title,
          primaryCta: "See pricing",
          variant: "centered"
        }),
        featureGridSection("sec-feature-grid-001", {
          heading: "What you get immediately",
          items: [
            {
              title: "Ranked candidate set",
              body: "Compare constrained directions instead of starting from one fragile output."
            },
            {
              title: "Built-in approval gate",
              body: "Export only after the structure clears the critic and validation boundary."
            }
          ],
          variant: "minimal"
        }),
        formSection("sec-form-001", {
          fields: ["Work email", "Company"],
          heading: "Talk to us",
          submitLabel: "Get pricing",
          variant: "inline"
        })
      ])
  },
  {
    id: "editorial-brief",
    screenType: "marketingLanding",
    name: "Editorial Brief",
    description:
      "A calmer landing direction that uses stronger pacing and fewer, more distinct support sections.",
    hierarchyIntent:
      "Let the product story breathe, then use one proof block and one short list to sharpen the argument.",
    densityEnvelope: ["editorial"],
    ctaStrategy:
      "Use two hero CTAs only when the story benefits from a softer secondary path; do not repeat them later.",
    allowedVariants: ["split", "minimal", "detailed"],
    antiPatternNotes: [
      "Do not fill the calmer pacing with empty decorative sections.",
      "Do not turn the support sections into dashboard-like data surfaces."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Use a more deliberate narrative pace, but keep one dominant message and one clear next step.",
          ctaCount: 2,
          eyebrow: "Editorial pace",
          hasMedia: true,
          heading: brief.title,
          primaryCta: "See the product",
          secondaryCta: "Read the approach",
          variant: "split"
        }),
        featureGridSection("sec-feature-grid-001", {
          heading: "Why the system is stronger than prompt luck",
          items: [
            {
              title: "Constrained generation",
              body: "Strong blueprints narrow the shape before outputs become generic."
            },
            {
              title: "Explicit criticism",
              body: "The workbench scores weak structure and explains why it fails."
            },
            {
              title: "Deterministic repair path",
              body: "Repairs are concrete enough to improve quality without a chat loop."
            }
          ],
          variant: "minimal"
        }),
        listSection("sec-list-001", {
          heading: "Signals a good landing page should send",
          items: [
            "One clear focal hierarchy",
            "Proof that sharpens the claim instead of repeating it",
            "A CTA that feels earned by the story"
          ],
          variant: "detailed"
        })
      ])
  }
];

export const marketingLandingBlueprints: ReadonlyArray<MarketingLandingBlueprint> =
  marketingBlueprintDefinitions;

export const defaultMarketingLandingBlueprintId =
  marketingBlueprintDefinitions[0]?.id ?? "signal-stack";

export function getMarketingLandingBlueprint(
  blueprintId: string
): MarketingLandingBlueprint {
  const blueprint = marketingBlueprintDefinitions.find(
    (entry) => entry.id === blueprintId
  );

  if (!blueprint) {
    throw new Error(`Unknown marketingLanding blueprint "${blueprintId}".`);
  }

  return blueprint;
}

export function createMarketingLandingPageFromBlueprint(
  blueprintId: string,
  brief: MarketingLandingScreenBrief
): PageDocument {
  return getMarketingLandingBlueprint(blueprintId).createPage(brief);
}
