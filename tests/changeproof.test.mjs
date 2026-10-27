import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CitationValidator } from '../dist/core/citation_validator.js';
import { AlignmentEngine } from '../dist/core/alignment_engine.js';
import { PlaywrightSynthesizer } from '../dist/core/playwright_synthesizer.js';
import { VideoProcessor } from '../dist/core/video_processor.js';
import { MetaSamAdapter } from '../dist/core/sam_adapter.js';

describe('ChangeProof: Multimodal Playwright Test Synthesis Engine', () => {

  const sampleBoundingBox = { x: 120, y: 340, width: 180, height: 45 };
  const sampleTranscript = 'Click on the Checkout button to proceed to payment';

  test('Test 1: Generates deterministic SHA-256 evidence hash', () => {
    const hash1 = CitationValidator.computeEvidenceHash(0, 1500, sampleBoundingBox, sampleTranscript);
    const hash2 = CitationValidator.computeEvidenceHash(0, 1500, sampleBoundingBox, sampleTranscript);

    assert.equal(hash1.length, 64);
    assert.equal(hash1, hash2);
  });

  test('Test 2: Validates a fully grounded test step', () => {
    const evidenceHash = CitationValidator.computeEvidenceHash(0, 1500, sampleBoundingBox, sampleTranscript);

    const step = {
      stepIndex: 1,
      action: 'click',
      targetSelector: 'button#checkout',
      evidence: {
        frameTimestampMs: 1500,
        frameIndex: 0,
        boundingBox: sampleBoundingBox,
        transcriptSpan: {
          startMs: 1200,
          endMs: 1800,
          text: sampleTranscript
        },
        confidence: 0.94,
        evidenceHash
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const result = CitationValidator.validateStep(step);
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });

  test('Test 3: Rejects step with zero or negative bounding box dimensions', () => {
    const invalidBox = { x: 100, y: 100, width: 0, height: 40 };
    const evidenceHash = CitationValidator.computeEvidenceHash(1, 2000, invalidBox, 'click');

    const step = {
      stepIndex: 2,
      action: 'click',
      targetSelector: 'button#pay',
      evidence: {
        frameTimestampMs: 2000,
        frameIndex: 1,
        boundingBox: invalidBox,
        transcriptSpan: { startMs: 1900, endMs: 2200, text: 'click' },
        confidence: 0.88,
        evidenceHash
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const result = CitationValidator.validateStep(step);
    assert.equal(result.valid, false);
    assert.match(result.error, /invalid or zero dimensions/i);
  });

  test('Test 4: Rejects step with tampered evidence hash', () => {
    const step = {
      stepIndex: 3,
      action: 'click',
      targetSelector: 'button#submit',
      evidence: {
        frameTimestampMs: 3000,
        frameIndex: 2,
        boundingBox: sampleBoundingBox,
        transcriptSpan: { startMs: 2900, endMs: 3200, text: sampleTranscript },
        confidence: 0.91,
        evidenceHash: '0000000000000000000000000000000000000000000000000000000000000000'
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const result = CitationValidator.validateStep(step);
    assert.equal(result.valid, false);
    assert.match(result.error, /Evidence hash mismatch/i);
  });

  test('Test 5: Rejects low-confidence detections below 0.50 threshold', () => {
    const evidenceHash = CitationValidator.computeEvidenceHash(0, 1000, sampleBoundingBox, 'click');

    const step = {
      stepIndex: 4,
      action: 'click',
      targetSelector: 'button#login',
      evidence: {
        frameTimestampMs: 1000,
        frameIndex: 0,
        boundingBox: sampleBoundingBox,
        transcriptSpan: { startMs: 900, endMs: 1100, text: 'click' },
        confidence: 0.35,
        evidenceHash
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const result = CitationValidator.validateStep(step);
    assert.equal(result.valid, false);
    assert.match(result.error, /below minimum threshold/i);
  });

  test('Test 6: AlignmentEngine correlates audio intents with visual keyframe elements', () => {
    const keyframes = [
      {
        frameIndex: 0,
        timestampMs: 1000,
        imageHash: 'frame_hash_0',
        detectedElements: [
          {
            id: 'btn-checkout',
            label: 'Checkout',
            boundingBox: { x: 50, y: 150, width: 120, height: 40 },
            isClickable: true,
            confidence: 0.96
          },
          {
            id: 'input-email',
            label: 'Email',
            boundingBox: { x: 50, y: 80, width: 250, height: 35 },
            isClickable: true,
            confidence: 0.92
          }
        ]
      }
    ];

    const transcripts = [
      {
        segmentIndex: 1,
        startMs: 1050,
        endMs: 1800,
        text: 'Click on the Checkout button',
        intent: 'action',
        targetElementDescription: 'Checkout'
      }
    ];

    const steps = AlignmentEngine.alignSession(keyframes, transcripts);
    assert.equal(steps.length, 1);
    assert.equal(steps[0].action, 'click');
    assert.equal(steps[0].evidence.frameIndex, 0);
    assert.equal(steps[0].evidence.boundingBox.width, 120);
    assert.equal(steps[0].evidence.confidence, 0.96);
    assert.ok(steps[0].evidence.evidenceHash.length === 64);
  });

  test('Test 7: PlaywrightSynthesizer generates typed executable Playwright code with citations', () => {
    const evidenceHash = CitationValidator.computeEvidenceHash(0, 1000, sampleBoundingBox, 'click checkout');

    const steps = [
      {
        stepIndex: 1,
        action: 'click',
        targetSelector: 'button:has-text("Checkout")',
        evidence: {
          frameTimestampMs: 1000,
          frameIndex: 0,
          boundingBox: sampleBoundingBox,
          transcriptSpan: { startMs: 950, endMs: 1200, text: 'click checkout' },
          confidence: 0.95,
          evidenceHash
        },
        isDestructive: false,
        requiresOperatorConfirmation: false
      }
    ];

    const suite = PlaywrightSynthesizer.synthesizeSuite('Checkout Flow E2E', 'https://example.com', steps);

    assert.ok(suite.suiteId.startsWith('suite_'));
    assert.equal(suite.testName, 'Checkout Flow E2E');
    assert.equal(suite.steps.length, 1);
    assert.ok(suite.playwrightCode.includes(`import { test, expect } from '@playwright/test';`));
    assert.ok(suite.playwrightCode.includes(`// [Evidence: Frame #0 @ 1000ms`));
    assert.ok(suite.playwrightCode.includes(`await page.goto('https://example.com');`));
    assert.ok(suite.playwrightCode.includes(`await target_1.click();`));
  });

  test('Test 8: Full end-to-end multimodal alignment, citation validation, and test synthesis', () => {
    const keyframes = [
      {
        frameIndex: 0,
        timestampMs: 1200,
        imageHash: 'frame_hash_0',
        detectedElements: [
          {
            id: 'input-search',
            label: 'Search catalog',
            boundingBox: { x: 20, y: 30, width: 200, height: 35 },
            isClickable: true,
            confidence: 0.93
          }
        ]
      },
      {
        frameIndex: 1,
        timestampMs: 3400,
        imageHash: 'frame_hash_1',
        detectedElements: [
          {
            id: 'btn-order',
            label: 'Place Order',
            boundingBox: { x: 300, y: 500, width: 140, height: 45 },
            isClickable: true,
            confidence: 0.97
          }
        ]
      }
    ];

    const transcripts = [
      {
        segmentIndex: 1,
        startMs: 1250,
        endMs: 2000,
        text: 'Type "running shoes" into the search bar',
        intent: 'action',
        targetElementDescription: 'search'
      },
      {
        segmentIndex: 2,
        startMs: 3450,
        endMs: 4100,
        text: 'Click on Place Order',
        intent: 'action',
        targetElementDescription: 'order'
      }
    ];

    // Step 1: Align
    const alignedSteps = AlignmentEngine.alignSession(keyframes, transcripts);
    assert.equal(alignedSteps.length, 2);

    // Step 2: Validate
    const validation = CitationValidator.validateSuite(alignedSteps);
    assert.equal(validation.valid, true);
    assert.equal(validation.attestationCount, 2);
    assert.equal(validation.errors.length, 0);

    // Step 3: Synthesize
    const suite = PlaywrightSynthesizer.synthesizeSuite('Order Placement E2E', 'https://shop.example.com', alignedSteps);
    assert.equal(suite.steps.length, 2);
    assert.ok(suite.playwrightCode.includes(`await input_1.fill('running shoes');`));
    assert.ok(suite.playwrightCode.includes(`await target_2.click();`));
  });

  test('Test 9: VideoProcessor hashes frames deterministically and deduplicates identical frames', () => {
    const bufferA = Buffer.from('frame_pixels_data_version_1');
    const bufferB = Buffer.from('frame_pixels_data_version_1');
    const bufferC = Buffer.from('frame_pixels_data_version_2_changed');

    const hashA = VideoProcessor.hashFrame(bufferA);
    const hashB = VideoProcessor.hashFrame(bufferB);
    const hashC = VideoProcessor.hashFrame(bufferC);

    assert.equal(hashA, hashB);
    assert.notEqual(hashA, hashC);

    // Sequence with identical consecutive frame
    const rawFrames = [
      { timestampMs: 0, data: bufferA },
      { timestampMs: 33, data: bufferB }, // duplicate
      { timestampMs: 66, data: bufferC }
    ];

    const processed = VideoProcessor.processFrameSequence(rawFrames, true);
    assert.equal(processed.length, 2);
    assert.equal(processed[0].frameIndex, 0);
    assert.equal(processed[1].frameIndex, 1);
    assert.equal(processed[1].timestampMs, 66);
  });

  test('Test 10: VideoProcessor calculates normalized frame delta between distinct byte buffers', () => {
    const b1 = new Uint8Array([10, 20, 30, 40]);
    const b2 = new Uint8Array([10, 20, 30, 40]);
    const b3 = new Uint8Array([255, 255, 255, 255]);

    const zeroDelta = VideoProcessor.computeFrameDelta(b1, b2);
    const highDelta = VideoProcessor.computeFrameDelta(b1, b3);

    assert.equal(zeroDelta, 0);
    assert.ok(highDelta > 0.80);
  });

  test('Test 11: VideoProcessor segments voice narration audio windows into transcript segments', () => {
    const windows = [
      { startMs: 500, endMs: 1500, transcript: '  Click on Login button  ', intent: 'action', targetElementDescription: 'login' },
      { startMs: 1600, endMs: 2500, transcript: 'Verify dashboard is visible', intent: 'assertion' }
    ];

    const segments = VideoProcessor.segmentAudioTrack(windows);
    assert.equal(segments.length, 2);
    assert.equal(segments[0].segmentIndex, 1);
    assert.equal(segments[0].text, 'Click on Login button');
    assert.equal(segments[0].intent, 'action');
    assert.equal(segments[1].intent, 'assertion');
  });

  test('Test 12: MetaSamAdapter segments keyframe with user prompt points', async () => {
    const adapter = new MetaSamAdapter({ minConfidenceThreshold: 0.70 });

    const keyframe = {
      frameIndex: 0,
      timestampMs: 1000,
      imageHash: 'frame_hash_test',
      detectedElements: []
    };

    // User clicked at (450, 300)
    const elements = await adapter.segmentKeyframe(keyframe, [{ x: 450, y: 300, label: 1 }]);
    assert.equal(elements.length, 1);
    assert.equal(elements[0].id, 'elem_0_1');
    assert.equal(elements[0].isClickable, true);
    assert.ok(elements[0].confidence >= 0.70);
    assert.ok(elements[0].boundingBox.width > 0);
    assert.ok(elements[0].boundingBox.height > 0);
  });

  test('Test 13: MetaSamAdapter filters out low-confidence segmentations below threshold', async () => {
    // Set threshold higher than deterministic score (0.94)
    const highThresholdAdapter = new MetaSamAdapter({ minConfidenceThreshold: 0.99 });

    const keyframe = {
      frameIndex: 1,
      timestampMs: 2000,
      imageHash: 'frame_hash_high',
      detectedElements: []
    };

    const elements = await highThresholdAdapter.segmentKeyframe(keyframe, [{ x: 100, y: 200, label: 1 }]);
    // Element with 0.94 confidence should be filtered out, fallback main content area generated
    assert.ok(elements.length >= 1);
    assert.equal(elements[0].id, 'elem_1_main');
  });

});

