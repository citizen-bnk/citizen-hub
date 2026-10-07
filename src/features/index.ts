import type { Feature } from "@/platform/feature";

/**
 * Every folder in src/features with a feature.ts is part of the Hub: add a folder and it appears (routes, navigation, role
 * gate and Home tiles); delete the folder and it is gone. Nothing else needs editing.
 */
const found = import.meta.glob<{ default: Feature }>("./*/feature.ts", { eager: true });

export const features: readonly Feature[] = Object.values(found).map((m) => m.default);
