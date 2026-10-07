import { allowed } from "./auth/roles";
import { type Feature, type Screen, type Section, SECTION_ORDER, type Widget } from "./feature";

/** Pure functions over a list of features. The app passes the discovered list (see features/index.ts); tests pass their own. */

export type Resolved = { feature: Feature; screen: Screen; roles: readonly string[]; section: Section };

export const screenRoles = (f: Feature, s: Screen) => s.roles ?? f.roles;

export const canOpen = (f: Feature, s: Screen, roles: readonly string[]) => allowed(roles, screenRoles(f, s));

export function allScreens(features: readonly Feature[]): Resolved[] {
  return features.flatMap((feature) => feature.screens.map((screen) => ({ feature, screen, roles: screenRoles(feature, screen), section: screen.section ?? feature.section })));
}

export type NavGroup = { group: string | null; items: Resolved[] };
export type NavSection = { section: Section; groups: NavGroup[] };

/** The side navigation for someone holding `roles`: only sections and items they may open. */
export function navFor(features: readonly Feature[], roles: readonly string[]): NavSection[] {
  const visible = allScreens(features).filter((r) => r.screen.nav && canOpen(r.feature, r.screen, roles));
  return SECTION_ORDER.flatMap((section) => {
    const here = visible.filter((r) => r.section === section);
    if (!here.length) return [];
    const groups: NavGroup[] = [];
    for (const r of here) {
      const key = r.screen.nav?.group ?? null;
      (groups.find((g) => g.group === key) ?? groups[groups.push({ group: key, items: [] }) - 1]).items.push(r);
    }
    return [{ section, groups }];
  });
}

/** Sections that are workspaces in their own right (not Home or Account). */
export const workspaces = (nav: NavSection[]) => nav.filter((n) => n.section !== "home" && n.section !== "account");

/** The first screen of a section, where its heading in the navigation leads. */
export const landing = (n: NavSection): string => n.groups[0].items[0].screen.path;

export function widgetsFor(features: readonly Feature[], roles: readonly string[]): (Widget & { feature: Feature })[] {
  return features
    .flatMap((feature) => (feature.widgets ?? []).map((w) => ({ ...w, feature })))
    .filter((w) => allowed(roles, w.roles))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/** "/Board-Meetings/" and "/boardmeetings" squash to the same key, so every spelling of an old address matches. */
export const squash = (p: string) => p.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The new address for an old website address (any spelling, with its query), or null when the Hub did not take it over. */
export function resolveLegacy(features: readonly Feature[], pathname: string, search = ""): string | null {
  const key = squash(pathname);
  for (const { screen } of allScreens(features)) {
    if (!screen.legacy?.some((l) => squash(l) === key)) continue;
    if (!screen.path.includes(":")) return screen.path;
    return screen.fromLegacy?.(new URLSearchParams(search)) ?? null;
  }
  return null;
}

/** Every address the website should send to the Hub: the new paths plus the old ones, both spellings. */
export function hubPaths(features: readonly Feature[]): string[] {
  const out = new Set<string>(["/"]);
  for (const { screen } of allScreens(features)) {
    if (!screen.path.includes(":")) out.add(screen.path);
    for (const l of screen.legacy ?? []) {
      out.add(l);
      out.add("/" + squash(l));
    }
  }
  return [...out].sort();
}

/** Fill the `:params` of a path from `values`. */
export const fillPath = (path: string, values: Record<string, string> = {}) =>
  path.replace(/:([A-Za-z]+)/g, (_m, k: string) => values[k] ?? "x");
