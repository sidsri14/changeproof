/**
 * ChangeProof: Multimodal Regression-Testing Agent Schema
 * Meta Global AI Developer Hackathon ($1,000,000 Aggregate Prize Pool)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroundedEvidence {
  frameTimestampMs: number;
  frameIndex: number;
  boundingBox: BoundingBox;
  transcriptSpan: {
    startMs: number;
    endMs: number;
    text: string;
  };
  confidence: number;
  evidenceHash: string; // SHA-256 cryptographic attestation of bounding box + frame hash
}

export type ActionType = 
  | 'click' 
  | 'fill' 
  | 'navigate' 
  | 'assert_visible' 
  | 'assert_text' 
  | 'assert_url';

export interface GroundedTestStep {
  stepIndex: number;
  action: ActionType;
  targetSelector: string;
  targetValue?: string;
  expectedOutcome?: string;
  evidence: GroundedEvidence;
  isDestructive: boolean;
  requiresOperatorConfirmation: boolean;
}

export interface SynthesizedTestSuite {
  suiteId: string;
  testName: string;
  baseUrl: string;
  generatedAt: string;
  steps: GroundedTestStep[];
  playwrightCode: string;
  validationRun?: {
    passed: boolean;
    durationMs: number;
    regressionCaught?: string;
  };
}

export interface MultimodalKeyframe {
  frameIndex: number;
  timestampMs: number;
  imageHash: string;
  detectedElements: Array<{
    id: string;
    label: string;
    boundingBox: BoundingBox;
    isClickable: boolean;
    confidence: number;
  }>;
}

export interface AudioTranscriptSegment {
  segmentIndex: number;
  startMs: number;
  endMs: number;
  text: string;
  intent: 'action' | 'assertion' | 'navigation' | 'commentary';
  targetElementDescription?: string;
}
