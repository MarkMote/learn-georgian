// app/structure/[moduleId]/utils/modules.ts

import { FrameData } from '../types';

export interface ModuleConfig {
  id: number;
  name: string;
  description: string;
  frames: string[];
}

// Modules are now generated dynamically from frames.csv - one module per frame
// This function builds the modules array from parsed frame data
export function buildModulesFromFrames(frames: FrameData[]): ModuleConfig[] {
  return frames.map((frame, index) => ({
    id: index + 1,
    name: frame.frame_name,
    description: frame.usage_summary,
    frames: [frame.frame_id],
  }));
}
