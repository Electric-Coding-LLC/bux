import type {
  DashboardArtDirectionProfile,
  PlaygroundProject
} from "@bux/core-model";

export interface DashboardArtDirectionOption {
  description: string;
  label: string;
  value: DashboardArtDirectionProfile;
}

type DashboardArtDirectionDefinition = DashboardArtDirectionOption & {
  colors: {
    accent: string;
    border: string;
    surfaceDefault: string;
    surfaceMuted: string;
    textPrimary: string;
    textSecondary: string;
  };
  radii: {
    lg: number;
    md: number;
  };
  spacingScale: number[];
  typographyScale: number[];
};

const dashboardArtDirectionDefinitions: Record<
  DashboardArtDirectionProfile,
  DashboardArtDirectionDefinition
> = {
  quietSignal: {
    value: "quietSignal",
    label: "Quiet Signal",
    description:
      "Keep the dashboard calm and restrained, with softer chrome and a summary-first scan.",
    colors: {
      accent: "#0F766E",
      border: "#D5E2E4",
      surfaceDefault: "#FFFFFF",
      surfaceMuted: "#F3F8F8",
      textPrimary: "#0F172A",
      textSecondary: "#5B6473"
    },
    radii: {
      md: 14,
      lg: 22
    },
    spacingScale: [4, 8, 12, 18, 26, 36, 48, 60],
    typographyScale: [12, 14, 16, 20, 24, 32, 40]
  },
  commandCenter: {
    value: "commandCenter",
    label: "Command Center",
    description:
      "Bias toward sharper contrast and tighter operational focus so queues feel direct and urgent.",
    colors: {
      accent: "#0B63F6",
      border: "#B7C8E6",
      surfaceDefault: "#FCFDFE",
      surfaceMuted: "#EAF1FB",
      textPrimary: "#111827",
      textSecondary: "#475569"
    },
    radii: {
      md: 6,
      lg: 12
    },
    spacingScale: [4, 8, 12, 16, 22, 30, 40, 48],
    typographyScale: [12, 14, 16, 21, 26, 34, 42]
  },
  editorialPulse: {
    value: "editorialPulse",
    label: "Editorial Pulse",
    description:
      "Open with stronger headline contrast and warmer surfaces so the dashboard reads like an authored briefing.",
    colors: {
      accent: "#B45309",
      border: "#E7D7C3",
      surfaceDefault: "#FFFDFC",
      surfaceMuted: "#FAF4EC",
      textPrimary: "#1C1917",
      textSecondary: "#57534E"
    },
    radii: {
      md: 10,
      lg: 18
    },
    spacingScale: [4, 8, 12, 18, 28, 40, 52, 68],
    typographyScale: [12, 15, 17, 22, 28, 38, 48]
  }
};

export const dashboardArtDirectionOptions: ReadonlyArray<DashboardArtDirectionOption> =
  Object.values(dashboardArtDirectionDefinitions).map(
    ({ description, label, value }) => ({
      description,
      label,
      value
    })
  );

export function applyDashboardArtDirection(
  project: PlaygroundProject,
  profile: DashboardArtDirectionProfile
): PlaygroundProject {
  const definition = dashboardArtDirectionDefinitions[profile];

  return {
    ...project,
    tokens: {
      ...project.tokens,
      typography: {
        ...project.tokens.typography,
        scale: [...definition.typographyScale]
      },
      spacing: {
        ...project.tokens.spacing,
        scale: [...definition.spacingScale]
      },
      radii: {
        ...project.tokens.radii,
        md: definition.radii.md,
        lg: definition.radii.lg
      },
      colors: {
        roles: {
          ...project.tokens.colors.roles,
          "accent.primary": definition.colors.accent,
          "border.subtle": definition.colors.border,
          "surface.default": definition.colors.surfaceDefault,
          "surface.muted": definition.colors.surfaceMuted,
          "text.primary": definition.colors.textPrimary,
          "text.secondary": definition.colors.textSecondary
        }
      }
    }
  };
}
