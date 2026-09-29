import { describe, expect, it } from "vitest";

import {
  NVIDIA_PHYSICAL_AI_SKILLS,
  NVIDIA_PHYSICAL_AI_TRACKS,
} from "./nvidia-physical-ai";

describe("NVIDIA Physical AI catalog", () => {
  it("contains the current simulation and robotics skill set", () => {
    expect(NVIDIA_PHYSICAL_AI_SKILLS).toHaveLength(14);

    const ids = new Set(NVIDIA_PHYSICAL_AI_SKILLS.map((skill) => skill.id));

    expect(ids.has("isaac-mission-control-showcase")).toBe(true);
    expect(ids.has("i4h-workflow-create")).toBe(true);
    expect(ids.has("i4h-workflow-dataset-replay")).toBe(true);
    expect(ids.has("i4h-workflow-train-rl")).toBe(true);
    expect(ids.has("i4h-workflow-validate")).toBe(true);
    expect(ids.has("omniverse-cad-to-simready")).toBe(true);
    expect(ids.has("omniverse-usd-performance-tuning")).toBe(true);
  });

  it("keeps every track reference bound to a known skill", () => {
    const ids = new Set(NVIDIA_PHYSICAL_AI_SKILLS.map((skill) => skill.id));

    for (const track of NVIDIA_PHYSICAL_AI_TRACKS) {
      expect(track.skills.length).toBeGreaterThan(0);

      for (const skillId of track.skills) {
        expect(ids.has(skillId)).toBe(true);
      }
    }
  });
});
