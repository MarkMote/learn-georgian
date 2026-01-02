// app/structure/[moduleId]/utils/dataProcessing.ts

import Papa from "papaparse";
import { FrameData, FrameExampleData, KnownExampleState, DifficultyRating } from "../types";
import { ModuleConfig } from "./modules";

export function parseFramesCSV(csvText: string): FrameData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });

  return result.data.map((row: any) => ({
    frame_id: row.frame_id || "",
    stage_id: row.stage_id || "",
    frame_name: row.frame_name || "",
    slot_map: row.slot_map || "",
    usage_summary: row.usage_summary || "",
    deep_grammar: row.deep_grammar || "",
  }));
}

export function parseExamplesCSV(csvText: string): FrameExampleData[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });

  return result.data.map((row: any) => ({
    example_id: row.example_id || "",
    frame_id: row.frame_id || "",
    english: row.english || "",
    georgian: row.georgian || "",
    context: row.context || "",
    usage_tip: row.usage_tip || "",
  }));
}

export function getFrameById(frames: FrameData[], frameId: string): FrameData | undefined {
  return frames.find(f => f.frame_id === frameId);
}

export function buildFrameLookup(frames: FrameData[]): Map<string, FrameData> {
  const lookup = new Map<string, FrameData>();
  for (const frame of frames) {
    lookup.set(frame.frame_id, frame);
  }
  return lookup;
}

export function getExamplesForModule(
  examples: FrameExampleData[],
  moduleId: number,
  modules: ModuleConfig[]
): FrameExampleData[] {
  const moduleConfig = modules.find(m => m.id === moduleId);
  if (!moduleConfig) return [];

  const frameSet = new Set(moduleConfig.frames);
  return examples.filter(ex => frameSet.has(ex.frame_id));
}

export function difficultyToScore(difficulty: DifficultyRating): number {
  switch (difficulty) {
    case "easy": return 3;
    case "good": return 2;
    case "hard": return 1;
    case "fail": return 0;
  }
}

export function computePercentageScore(
  knownExamples: KnownExampleState[],
  moduleExamples: FrameExampleData[]
): number {
  if (moduleExamples.length === 0) return 0;

  const totalPossible = moduleExamples.length;
  let totalScore = 0;
  let scoredCount = 0;

  for (const example of moduleExamples) {
    const known = knownExamples.find(k => k.data.example_id === example.example_id);
    if (known) {
      totalScore += known.rating / 3;
      scoredCount++;
    }
  }

  const averageScore = scoredCount > 0 ? totalScore / scoredCount : 0;
  const coverage = scoredCount / totalPossible;

  return Math.round(averageScore * coverage * 100);
}

export function getExampleProgress(
  knownExamples: KnownExampleState[],
  moduleExamples: FrameExampleData[]
): { unlocked: number; total: number } {
  const total = moduleExamples.length;
  const knownIds = new Set(knownExamples.map(k => k.data.example_id));
  const unlocked = moduleExamples.filter(ex => knownIds.has(ex.example_id)).length;

  return { unlocked, total };
}

export function getFramesForModule(
  frames: FrameData[],
  moduleId: number,
  modules: ModuleConfig[]
): FrameData[] {
  const moduleConfig = modules.find(m => m.id === moduleId);
  if (!moduleConfig) return [];

  const frameSet = new Set(moduleConfig.frames);
  return frames.filter(f => frameSet.has(f.frame_id));
}

export function countExamplesPerFrame(
  examples: FrameExampleData[],
  frameId: string
): number {
  return examples.filter(ex => ex.frame_id === frameId).length;
}

export function getExampleCountsForModule(
  examples: FrameExampleData[],
  moduleId: number,
  modules: ModuleConfig[]
): Map<string, number> {
  const moduleConfig = modules.find(m => m.id === moduleId);
  if (!moduleConfig) return new Map();

  const counts = new Map<string, number>();
  for (const frameId of moduleConfig.frames) {
    counts.set(frameId, countExamplesPerFrame(examples, frameId));
  }
  return counts;
}
