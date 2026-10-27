import { CitationValidator } from './citation_validator.js';
import type { 
  MultimodalKeyframe, 
  AudioTranscriptSegment, 
  GroundedTestStep, 
  ActionType 
} from '../types/schema.js';

export class AlignmentEngine {
  /**
   * Correlates spoken audio transcript intents with visual keyframes and detected element bounding boxes.
   * Produces verifiable, groundable test steps.
   */
  public static alignSession(
    keyframes: MultimodalKeyframe[],
    transcripts: AudioTranscriptSegment[]
  ): GroundedTestStep[] {
    const steps: GroundedTestStep[] = [];
    let stepCounter = 1;

    for (const segment of transcripts) {
      if (segment.intent === 'commentary') {
        continue; // Skip non-actionable commentary
      }

      // Find the closest visual keyframe matching segment startMs
      const matchingKeyframe = this.findClosestKeyframe(keyframes, segment.startMs);
      if (!matchingKeyframe) {
        continue;
      }

      // Determine the action type and target element
      const { action, selector, value, element, isDestructive } = this.resolveActionAndElement(
        segment,
        matchingKeyframe
      );

      if (!element) {
        continue; // Cannot synthesize step without visual grounding
      }

      // Compute deterministic SHA-256 evidence hash
      const evidenceHash = CitationValidator.computeEvidenceHash(
        matchingKeyframe.frameIndex,
        matchingKeyframe.timestampMs,
        element.boundingBox,
        segment.text
      );

      const step: GroundedTestStep = {
        stepIndex: stepCounter++,
        action,
        targetSelector: selector,
        targetValue: value,
        expectedOutcome: segment.intent === 'assertion' ? `Element ${selector} satisfies assertion` : undefined,
        evidence: {
          frameTimestampMs: matchingKeyframe.timestampMs,
          frameIndex: matchingKeyframe.frameIndex,
          boundingBox: element.boundingBox,
          transcriptSpan: {
            startMs: segment.startMs,
            endMs: segment.endMs,
            text: segment.text
          },
          confidence: element.confidence,
          evidenceHash
        },
        isDestructive,
        requiresOperatorConfirmation: isDestructive
      };

      steps.push(step);
    }

    return steps;
  }

  private static findClosestKeyframe(
    keyframes: MultimodalKeyframe[],
    timestampMs: number
  ): MultimodalKeyframe | undefined {
    if (keyframes.length === 0) return undefined;

    return keyframes.reduce((closest, current) => {
      const closestDiff = Math.abs(closest.timestampMs - timestampMs);
      const currentDiff = Math.abs(current.timestampMs - timestampMs);
      return currentDiff < closestDiff ? current : closest;
    });
  }

  private static resolveActionAndElement(
    segment: AudioTranscriptSegment,
    keyframe: MultimodalKeyframe
  ): {
    action: ActionType;
    selector: string;
    value?: string;
    element?: MultimodalKeyframe['detectedElements'][0];
    isDestructive: boolean;
  } {
    const text = segment.text.toLowerCase();
    let action: ActionType = 'click';
    let isDestructive = false;

    if (text.includes('click') || text.includes('tap') || text.includes('press') || text.includes('select')) {
      action = 'click';
    } else if (text.includes('type') || text.includes('enter') || text.includes('fill') || text.includes('input')) {
      action = 'fill';
    } else if (text.includes('verify') || text.includes('assert') || text.includes('check') || text.includes('ensure')) {
      action = text.includes('text') ? 'assert_text' : 'assert_visible';
    } else if (text.includes('navigate') || text.includes('go to') || text.includes('open')) {
      action = 'navigate';
    }

    if (text.includes('delete') || text.includes('remove') || text.includes('drop') || text.includes('terminate')) {
      isDestructive = true;
    }

    // Match segment target description with detected elements in keyframe
    const targetDesc = (segment.targetElementDescription || segment.text).toLowerCase();
    
    // Find best candidate element in keyframe
    let bestElement = keyframe.detectedElements.find(el => {
      const label = el.label.toLowerCase();
      const id = el.id.toLowerCase();
      return targetDesc.includes(label) || targetDesc.includes(id) || label.includes(targetDesc);
    });

    // Fallback: pick the highest confidence clickable element if action is click/fill
    if (!bestElement && (action === 'click' || action === 'fill')) {
      bestElement = keyframe.detectedElements
        .filter(el => el.isClickable)
        .sort((a, b) => b.confidence - a.confidence)[0];
    }

    // Default selector generation
    let selector = bestElement ? `[data-testid="${bestElement.id}"]` : '';
    if (bestElement && bestElement.label) {
      selector = `button:has-text("${bestElement.label}"), [aria-label="${bestElement.label}"], [data-testid="${bestElement.id}"]`;
    }

    // Extract fill value if action is fill
    let value: string | undefined = undefined;
    if (action === 'fill') {
      const match = segment.text.match(/(?:type|enter|fill)\s+["']?([^"']+)["']?\s+(?:into|in)/i);
      if (match) {
        value = match[1].trim();
      } else {
        value = 'test_input_value';
      }
    }

    return {
      action,
      selector,
      value,
      element: bestElement,
      isDestructive
    };
  }
}
