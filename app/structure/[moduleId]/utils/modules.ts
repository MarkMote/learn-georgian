// app/structure/[moduleId]/utils/modules.ts

export interface ModuleConfig {
  id: number;
  name: string;
  description: string;
  frames: string[];
}

export const MODULES: ModuleConfig[] = [
  {
    id: 1,
    name: "States & Identity",
    description: "What things are and where they are.",
    frames: ["identity_state", "location_state", "origin_state", "passive_state_result"]
  },
  {
    id: 2,
    name: "Motion & Direction",
    description: "How people and things move in space.",
    frames: ["motion_away_present", "motion_toward_present", "irregular_future_motion", "motion_advanced_directional"]
  },
  {
    id: 3,
    name: "Doing Things",
    description: "Actions you actively perform.",
    frames: ["doing_present", "activity_present", "taking_getting", "process_start_finish"]
  },
  {
    id: 4,
    name: "Interaction & Exchange",
    description: "Doing things with or for others.",
    frames: ["communication_interaction_present", "objective_version_present", "commerce_transaction_present", "selection_order"]
  },
  {
    id: 5,
    name: "Experience & Feelings",
    description: "Things that happen to you internally.",
    frames: ["emotion_experiencer_present", "physical_sensations", "desire_present", "liking_present"]
  },
  {
    id: 6,
    name: "Mind & Ability",
    description: "What you know, understand, or are able to do.",
    frames: ["perception_experiencer_present", "knowledge_present", "ability_present", "preference_present"]
  },
  {
    id: 7,
    name: "Possession & Relationships",
    description: "How things and people relate to you.",
    frames: ["possession_inanimate", "possession_animate", "ownership_belonging", "expectation_waiting"]
  },
  {
    id: 8,
    name: "Intent, Rules & Outcomes",
    description: "Plans, obligations, permissions, and results.",
    frames: ["plans_intent", "obligation_must", "permission_possibility", "evidential_perfect"]
  }
];

export function getModuleById(id: number): ModuleConfig | undefined {
  return MODULES.find(m => m.id === id);
}

export function getModuleCount(): number {
  return MODULES.length;
}
