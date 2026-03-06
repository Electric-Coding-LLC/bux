import {
  CURRENT_SCHEMA_VERSION,
  type OnboardingScreenBrief,
  type PageDocument,
  type SectionNode
} from "@bux/core-model";
import type { OnboardingBlueprint } from "../types";

function heroSection(
  id: string,
  options: {
    body: string;
    ctaCount: number;
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
      columns: options.items.length >= 3 ? 3 : 2,
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

const onboardingBlueprintDefinitions: OnboardingBlueprint[] = [
  {
    id: "guided-launch",
    screenType: "onboarding",
    name: "Guided Launch",
    description:
      "Lead with orientation, then move through setup steps before landing on one clear activation form.",
    hierarchyIntent:
      "Make the first read obvious, keep setup steps lightweight, and end in a single activation surface.",
    densityEnvelope: ["guided", "focused"],
    ctaStrategy:
      "Use one clear primary action in the intro, then keep the setup form as the only real completion target.",
    allowedVariants: ["split", "minimal", "stacked"],
    antiPatternNotes: [
      "Do not scatter multiple equal CTAs across each section.",
      "Do not let step explanation overpower the final setup action."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Set the essentials first, then activate the workspace once the setup path is clear.",
          ctaCount: 1,
          eyebrow: "New workspace",
          hasMedia: true,
          heading: brief.title,
          primaryCta: "Start setup",
          variant: "split"
        }),
        featureGridSection("sec-feature-grid-001", {
          heading: "What happens next",
          items: [
            {
              title: "Confirm workspace identity",
              body: "Name the workspace, set the visible defaults, and choose the right locale."
            },
            {
              title: "Invite the first team members",
              body: "Bring in the first operators before workflows start to spread."
            },
            {
              title: "Turn on the baseline rules",
              body: "Apply the default approval and notification policy once the basics are ready."
            }
          ],
          variant: "minimal"
        }),
        formSection("sec-form-001", {
          fields: ["Workspace name", "Default locale", "Owner email"],
          heading: "Finish core setup",
          submitLabel: "Activate workspace",
          variant: "stacked"
        })
      ])
  },
  {
    id: "quick-activate",
    screenType: "onboarding",
    name: "Quick Activate",
    description:
      "A compact onboarding path that strips setup down to one intro and one immediate action surface.",
    hierarchyIntent:
      "Keep the screen short, front-load the promise, and let one form carry the conversion.",
    densityEnvelope: ["compact", "focused"],
    ctaStrategy: "Keep a single CTA in the hero and avoid additional supporting action bars.",
    allowedVariants: ["centered", "stacked"],
    antiPatternNotes: [
      "Do not add support sections that interrupt the first-run action.",
      "Do not split a short onboarding path into decorative cards."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Capture the few setup choices that matter, then get the team into the product immediately.",
          ctaCount: 1,
          eyebrow: "Launch fast",
          heading: brief.title,
          primaryCta: "Set up workspace",
          variant: "centered"
        }),
        formSection("sec-form-001", {
          fields: ["Workspace name", "Team size", "Primary goal"],
          heading: "Start with the essentials",
          submitLabel: "Continue",
          variant: "stacked"
        })
      ])
  },
  {
    id: "checklist-pulse",
    screenType: "onboarding",
    name: "Checklist Pulse",
    description:
      "A guided checklist structure that shows the first-run path as a short operational sequence.",
    hierarchyIntent:
      "Treat onboarding like a sequence of steps, with one compact checklist before the setup handoff.",
    densityEnvelope: ["guided", "compact"],
    ctaStrategy:
      "Use the intro CTA to commit to the flow, then let the checklist and form share a single completion path.",
    allowedVariants: ["stacked", "simple", "inline"],
    antiPatternNotes: [
      "Do not turn the checklist into a second marketing section.",
      "Do not introduce multiple forms for one onboarding decision."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "A short setup sequence keeps the first run confident without dragging the user through filler.",
          ctaCount: 1,
          eyebrow: "First-run checklist",
          heading: brief.title,
          primaryCta: "Review setup",
          variant: "stacked"
        }),
        listSection("sec-list-001", {
          heading: "Complete these three steps",
          items: [
            "Name the workspace and set the visible defaults.",
            "Invite the first owners and confirm their roles.",
            "Choose how alerts should reach the team on day one."
          ],
          variant: "simple"
        }),
        formSection("sec-form-001", {
          fields: ["Workspace name", "Owner email", "Alert channel"],
          heading: "Lock in the starting state",
          submitLabel: "Finish onboarding",
          variant: brief.density === "compact" ? "inline" : "stacked"
        })
      ])
  },
  {
    id: "team-kickoff",
    screenType: "onboarding",
    name: "Team Kickoff",
    description:
      "An onboarding flow that frames the product around team setup before asking for the final activation details.",
    hierarchyIntent:
      "Lead with why the team should move now, then compress setup guidance into one short operational handoff.",
    densityEnvelope: ["focused", "guided"],
    ctaStrategy:
      "Keep the intro aspirational, but let the final form remain the only actionable destination.",
    allowedVariants: ["split", "detailed", "stacked"],
    antiPatternNotes: [
      "Do not let team guidance become a second hero.",
      "Do not stack multiple explanatory sections before the setup form."
    ],
    createPage: (brief) =>
      page(brief.title, [
        heroSection("sec-hero-001", {
          body: "Set the operating baseline for the first team, then activate the workspace once the first roles are clear.",
          ctaCount: 1,
          eyebrow: "Bring the team in",
          hasMedia: true,
          heading: brief.title,
          primaryCta: "Prepare workspace",
          variant: "split"
        }),
        listSection("sec-list-001", {
          heading: "Before you activate",
          items: [
            "Choose the owner who will approve the first changes.",
            "Confirm who should receive launch alerts.",
            "Set the shared language and naming rules for the workspace."
          ],
          variant: "detailed"
        }),
        formSection("sec-form-001", {
          fields: ["Owner email", "Workspace name", "Language"],
          heading: "Activate the workspace",
          submitLabel: "Launch workspace",
          variant: "stacked"
        })
      ])
  }
];

export const onboardingBlueprints: ReadonlyArray<OnboardingBlueprint> =
  onboardingBlueprintDefinitions;

export const defaultOnboardingBlueprintId =
  onboardingBlueprintDefinitions[0]?.id ?? "guided-launch";

export function getOnboardingBlueprint(
  blueprintId: string
): OnboardingBlueprint {
  const blueprint = onboardingBlueprintDefinitions.find(
    (entry) => entry.id === blueprintId
  );

  if (!blueprint) {
    throw new Error(`Unknown onboarding blueprint "${blueprintId}".`);
  }

  return blueprint;
}

export function createOnboardingPageFromBlueprint(
  blueprintId: string,
  brief: OnboardingScreenBrief
): PageDocument {
  return getOnboardingBlueprint(blueprintId).createPage(brief);
}
