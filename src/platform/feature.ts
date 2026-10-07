import type { ComponentType } from "react";

/** The areas of the Hub, in navigation order. A person sees only the areas their roles open. */
export type Section = "home" | "invest" | "board" | "office" | "admin" | "account";

export const SECTIONS: Record<Section, { label: string; blurb: string }> = {
  home: { label: "Home", blurb: "What needs your attention" },
  invest: { label: "Investments", blurb: "Your shares, payments, certificates and the data room" },
  board: { label: "Board", blurb: "Meetings, decisions and your compliance paperwork" },
  office: { label: "Back office", blurb: "Subscriptions, certificates, members, documents and communications" },
  admin: { label: "Administration", blurb: "Users, roles and board positions" },
  account: { label: "Account", blurb: "Your profile and notifications" },
};
export const SECTION_ORDER = Object.keys(SECTIONS) as Section[];

type Page = () => Promise<{ default: ComponentType }>;

export type Screen = {
  /** Address inside the Hub, e.g. "/meetings/:meetingId". */
  path: string;
  title: string;
  /** Overrides the feature's section for this screen (e.g. a member's "Compliance" under Board, the staff review under Back office). */
  section?: Section;
  /** Lazy import of the screen: `() => import("./pages/Meetings")`. Each screen is its own chunk. */
  load: Page;
  /** Narrower than the feature's roles, when only some of them may open this screen. */
  roles?: readonly string[];
  /** In the side navigation. Omit for steps reached from another screen (detail, wizard). `group` is a sub-heading. */
  nav?: { group?: string };
  /** Old website addresses that now lead here (the website redirects them to the Hub, the Hub to `path`). */
  legacy?: readonly string[];
  /** For a screen whose path has `:params`: builds its address from an old link's query string (`?id=7` becomes `/meetings/7`). */
  fromLegacy?: (query: URLSearchParams) => string | null;
  /** Values for the `:params` in `path`, so tests can open the screen. */
  sample?: Record<string, string>;
};

/** A tile the feature contributes to the Home page for the roles that can use it. */
export type Widget = { id: string; roles: readonly string[]; load: Page; order?: number };

/**
 * A feature is a folder in src/features with a feature.ts that default-exports this. It is the whole contract with the shell:
 * the shell finds it, builds its routes, navigation, role gate and Home tiles, and knows nothing else about it.
 */
export type Feature = {
  id: string;
  section: Section;
  /** Who may open this feature's screens (super_admin always may). */
  roles: readonly string[];
  screens: readonly Screen[];
  widgets?: readonly Widget[];
};

export const defineFeature = (f: Feature): Feature => f;
