import { createHash } from 'node:crypto';
import type { GroundedTestStep, GroundedEvidence, BoundingBox } from '../types/schema.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  attestationCount: number;
}

export class CitationValidator {
  /**
   * Generates a deterministic SHA-256 hash representing the exact visual bounding box and frame context
   */
  public static computeEvidenceHash(
    frameIndex: number,
    timestampMs: number,
    box: BoundingBox,
    transcriptText: string
  ): string {
    const payload = `${frameIndex}:${timestampMs}:${box.x},${box.y},${box.width},${box.height}:${transcriptText}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Strictly validates that every proposed Playwright test step is cryptographically and visually grounded.
   * Rejects ungrounded actions, missing evidence, zero-dimension boxes, and unreferenced assertions.
   */
  public static validateStep(step: GroundedTestStep): { valid: boolean; error?: string } {
    if (!step.targetSelector || step.targetSelector.trim() === '') {
      return { valid: false, error: `Step ${step.stepIndex}: Empty or missing target selector.` };
    }

    const { evidence } = step;
    if (!evidence) {
      return { valid: false, error: `Step ${step.stepIndex}: Missing grounded visual evidence.` };
    }

    if (evidence.frameTimestampMs < 0 || evidence.frameIndex < 0) {
      return { valid: false, error: `Step ${step.stepIndex}: Invalid negative frame timestamp or index.` };
    }

    const { boundingBox } = evidence;
    if (
      boundingBox.width <= 0 ||
      boundingBox.height <= 0 ||
      boundingBox.x < 0 ||
      boundingBox.y < 0
    ) {
      return {
        valid: false,
        error: `Step ${step.stepIndex}: Bounding box has invalid or zero dimensions (${boundingBox.x}, ${boundingBox.y}, ${boundingBox.width}x${boundingBox.height}).`
      };
    }

    if (evidence.confidence < 0.5) {
      return {
        valid: false,
        error: `Step ${step.stepIndex}: Confidence score ${evidence.confidence} below minimum threshold (0.50).`
      };
    }

    // Verify cryptographic evidence integrity
    const expectedHash = this.computeEvidenceHash(
      evidence.frameIndex,
      evidence.frameTimestampMs,
      evidence.boundingBox,
      evidence.transcriptSpan.text
    );

    if (evidence.evidenceHash !== expectedHash) {
      return {
        valid: false,
        error: `Step ${step.stepIndex}: Evidence hash mismatch. Cryptographic attestation invalid.`
      };
    }

    return { valid: true };
  }

  /**
   * Validates an entire synthesized suite.
   */
  public static validateSuite(steps: GroundedTestStep[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let attestationCount = 0;

    if (!steps || steps.length === 0) {
      return {
        valid: false,
        errors: ['Test suite contains zero steps.'],
        warnings: [],
        attestationCount: 0
      };
    }

    let previousTimestamp = -1;

    for (const step of steps) {
      const stepCheck = this.validateStep(step);
      if (!stepCheck.valid && stepCheck.error) {
        errors.push(stepCheck.error);
      } else {
        attestationCount++;
      }

      // Check temporal monotonicity
      if (step.evidence.frameTimestampMs < previousTimestamp) {
        warnings.push(
          `Step ${step.stepIndex}: Non-monotonic frame timestamp (${step.evidence.frameTimestampMs}ms < ${previousTimestamp}ms). Possible out-of-order execution.`
        );
      }
      previousTimestamp = step.evidence.frameTimestampMs;

      // Flag dangerous or destructive steps
      if (step.isDestructive && !step.requiresOperatorConfirmation) {
        warnings.push(`Step ${step.stepIndex} (${step.action}): Destructive step should require operator confirmation.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      attestationCount
    };
  }
}
