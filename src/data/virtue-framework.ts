/**
 * Canonical Virtue Framework (Stage 18)
 *
 * Single source of truth for virtue definitions used throughout Pathways.
 * These are educational reference definitions, not grading criteria.
 *
 * Virtues represent:
 * - Tendencies observed in story decisions
 * - Discussion starters for educators
 * - NOT grades, labels, or evaluations of character
 */

export interface VirtueDefinition {
  id: string; // e.g. "kindness"
  name: string; // "Kindness"
  description: string; // Plain-language definition
  decisionTendencies: string[]; // What types of choices reflect this virtue
  caselDomains: string[]; // Alignment labels (informational only)
}

/**
 * VIRTUE_FRAMEWORK
 *
 * Canonical definitions for all virtues in the Pathways system.
 * Aligned with CASEL (Collaborative for Academic, Social, and Emotional Learning)
 * competency domains for school/district legibility.
 */
export const VIRTUE_FRAMEWORK: Record<string, VirtueDefinition> = {
  kindness: {
    id: "kindness",
    name: "Kindness",
    description:
      "Noticing and considering how others may feel or be affected by a situation.",
    decisionTendencies: [
      "Listening before responding",
      "Considering group impact",
      "Acknowledging others' perspectives",
    ],
    caselDomains: ["Social Awareness"],
  },
  generosity: {
    id: "generosity",
    name: "Generosity",
    description:
      "Treating others with consideration and sharing openly.",
    decisionTendencies: [
      "Using thoughtful language",
      "Honoring rules or shared agreements",
      "Avoiding dismissive responses",
    ],
    caselDomains: ["Social Awareness", "Relationship Skills"],
  },
  knowledge: {
    id: "knowledge",
    name: "Knowledge",
    description:
      "Taking ownership of actions and seeking to understand situations fully.",
    decisionTendencies: [
      "Accepting consequences",
      "Completing agreed tasks",
      "Choosing long-term outcomes over convenience",
    ],
    caselDomains: ["Responsible Decision-Making"],
  },
  courage: {
    id: "courage",
    name: "Courage",
    description:
      "Choosing to act or speak up even when it feels uncomfortable or difficult.",
    decisionTendencies: [
      "Speaking up respectfully",
      "Addressing problems instead of avoiding them",
      "Making principled choices under pressure",
    ],
    caselDomains: ["Self-Awareness", "Responsible Decision-Making"],
  },
  resilience: {
    id: "resilience",
    name: "Resilience",
    description:
      "Managing impulses, emotions, and reactions in challenging situations.",
    decisionTendencies: [
      "Pausing before responding",
      "Choosing calm responses",
      "Avoiding impulsive actions",
    ],
    caselDomains: ["Self-Management"],
  },
};

/**
 * Get all virtue definitions as an array (for iteration)
 */
export function getVirtueDefinitions(): VirtueDefinition[] {
  return Object.values(VIRTUE_FRAMEWORK);
}

/**
 * Get a single virtue definition by ID
 */
export function getVirtueById(id: string): VirtueDefinition | undefined {
  return VIRTUE_FRAMEWORK[id];
}
