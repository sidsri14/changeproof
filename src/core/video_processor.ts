import { createHash } from 'node:crypto';
import type { 
  MultimodalKeyframe, 
  AudioTranscriptSegment 
} from '../types/schema.js';

export interface RawFrameInput {
  timestampMs: number;
  data: Uint8Array | Buffer;
  width?: number;
  height?: number;
}

export interface SpeechWindowInput {
  startMs: number;
  endMs: number;
  transcript: string;
  intent: 'action' | 'assertion' | 'navigation' | 'commentary';
  targetElementDescription?: string;
}

export class VideoProcessor {
  /**
   * Computes a deterministic SHA-256 hash of a raw video frame buffer.
   */
  public static hashFrame(data: Uint8Array | Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Processes a sequence of raw video frames into indexed MultimodalKeyframes with cryptographic integrity.
   * Filters out near-duplicate consecutive frames based on content hash.
   */
  public static processFrameSequence(
    rawFrames: RawFrameInput[],
    deduplicate: boolean = true
  ): MultimodalKeyframe[] {
    const keyframes: MultimodalKeyframe[] = [];
    let lastHash = '';
    let frameIndex = 0;

    for (const raw of rawFrames) {
      const imageHash = this.hashFrame(raw.data);

      if (deduplicate && imageHash === lastHash) {
        continue; // Skip static identical frame
      }

      keyframes.push({
        frameIndex: frameIndex++,
        timestampMs: raw.timestampMs,
        imageHash,
        detectedElements: [] // To be populated by Meta SAM segmentation adapter
      });

      lastHash = imageHash;
    }

    return keyframes;
  }

  /**
   * Measures content divergence between two frame byte arrays (sample-based Hamming/L1 distance).
   * Returns a normalized difference score between 0.0 (identical) and 1.0 (completely distinct).
   */
  public static computeFrameDelta(frameA: Uint8Array, frameB: Uint8Array): number {
    if (frameA.length === 0 || frameB.length === 0) return 1.0;
    const len = Math.min(frameA.length, frameB.length);
    if (len === 0) return 1.0;

    let diffSum = 0;
    // Sample up to 1000 bytes across the frame for fast deterministic comparison
    const step = Math.max(1, Math.floor(len / 1000));
    let samples = 0;

    for (let i = 0; i < len; i += step) {
      diffSum += Math.abs(frameA[i] - frameB[i]);
      samples++;
    }

    const maxPossibleDiff = samples * 255;
    return maxPossibleDiff > 0 ? diffSum / maxPossibleDiff : 0;
  }

  /**
   * Segments user voice narration into discrete timestamp-bounded speech segments.
   */
  public static segmentAudioTrack(
    speechWindows: SpeechWindowInput[]
  ): AudioTranscriptSegment[] {
    return speechWindows.map((win, idx) => ({
      segmentIndex: idx + 1,
      startMs: win.startMs,
      endMs: win.endMs,
      text: win.transcript.trim(),
      intent: win.intent,
      targetElementDescription: win.targetElementDescription
    }));
  }
}
