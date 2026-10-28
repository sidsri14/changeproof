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

export interface CandidateElement {
  tag: string;
  id?: string;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
  textContent: string;
  isDisabled: boolean;
  boundingBox?: BoundingBox;
  compositeSelector: string;
}

export interface SelectorRepairProposal {
  stepIndex: number;
  originalSelector: string;
  repairedSelector: string;
  confidence: number;
  reasons: string[];
  matchedElement: CandidateElement;
  repairProofHash: string;
}

export interface SuiteRepairResult {
  suiteId: string;
  originalSuiteName: string;
  repairedAt: string;
  totalFailedSteps: number;
  healedStepsCount: number;
  unresolvedStepsCount: number;
  repairs: SelectorRepairProposal[];
  healedSuite: SynthesizedTestSuite;
  validationRun?: {
    passed: boolean;
    durationMs: number;
  };
}

export interface BenchmarkSessionResult {
  sessionId: string;
  sessionName: string;
  totalSteps: number;
  groundedSteps: number;
  hallucinatedSteps: number;
  groundingPrecision: number;
  alignmentDurationMs: number;
  synthesisDurationMs: number;
  regressionCaught?: boolean;
  healedStepsCount?: number;
  selfHealingAccuracy?: number;
}

export interface BenchmarkReport {
  benchmarkId: string;
  runAt: string;
  totalSessions: number;
  totalActionsEvaluated: number;
  overallGroundingPrecision: number;
  overallHallucinationRate: number;
  overallSelfHealingAccuracy: number;
  avgAlignmentLatencyMs: number;
  avgSynthesisLatencyMs: number;
  avgThroughputActionsPerSec: number;
  sessionResults: BenchmarkSessionResult[];
  markdownSummary: string;
}


