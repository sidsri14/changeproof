export * from './types/schema.js';
export { CitationValidator, type ValidationResult } from './core/citation_validator.js';
export { AlignmentEngine } from './core/alignment_engine.js';
export { PlaywrightSynthesizer } from './core/playwright_synthesizer.js';
export { VideoProcessor, type RawFrameInput, type SpeechWindowInput } from './core/video_processor.js';
export { MetaSamAdapter, type SamPromptPoint, type SegmentedUiElement, type MetaSamConfig } from './core/sam_adapter.js';
export { HudVisualizer, type HudReportOptions } from './core/hud_visualizer.js';
export { runDemo } from './cli.js';
