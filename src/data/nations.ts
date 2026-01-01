/**
 * Arraadia Nation Data — Stage 3.1
 *
 * Defines the nations of Arraadia and the primary virtues
 * the learner develops when engaging with each nation.
 *
 * IMPORTANT:
 * - Virtues represent learning outcomes, not national traits.
 * - Metadata only — no narrative or gameplay logic.
 */

import { Virtue } from "./virtues";

export interface Nation {
  id: string;
  name: string;
  primaryVirtue: Virtue;
  shortDescription: string;
}

export const NATIONS: Record<string, Nation> = {
  odwan: {
    id: "odwan",
    name: "Odwan",
    primaryVirtue: "Courage",
    shortDescription:
      "A western nation built on conquest and military hierarchy, where fear and power dominate public life.",
  },
  hadarah: {
    id: "hadarah",
    name: "Hadarah",
    primaryVirtue: "Knowledge",
    shortDescription:
      "A southern civilization of scholars and traders that values diplomacy, health, and long-term thinking.",
  },
  burudia: {
    id: "burudia",
    name: "Burudia",
    primaryVirtue: "Generosity",
    shortDescription:
      "A cold northern nation marked by isolation, massive industries, and strictly transactional relationships.",
  },
  madlan: {
    id: "madlan",
    name: "Madlan",
    primaryVirtue: "Resilience",
    shortDescription:
      "A fallen nation whose people live scattered in exile, preserving culture and identity after destruction.",
  },
  thumur: {
    id: "thumur",
    name: "Thumur",
    primaryVirtue: "Kindness",
    shortDescription:
      "An eastern land of peaceful farming communities and craftsmanship, hesitant to confront conflict.",
  },
};

export function getAllNations(): Nation[] {
  return Object.values(NATIONS);
}

export function getNationById(id: string): Nation | undefined {
  return NATIONS[id];
}

export function getNationByVirtue(virtue: Virtue): Nation | undefined {
  return Object.values(NATIONS).find(
    (nation) => nation.primaryVirtue === virtue
  );
}
