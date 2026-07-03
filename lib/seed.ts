// ============================================================================
// Seed data — PRODUCTION: the portal starts EMPTY. Items and launch plans are
// created by the coordinators through the UI (or via the database seed for
// reference data). Bump SEED_V in domain.ts to force local storage to reset.
// ============================================================================
import type { Item } from './domain';
import type { LaunchPlan } from './domain';

export function seedItems(): Item[] {
  return [];
}

export function seedLaunchPlans(): LaunchPlan[] {
  return [];
}
