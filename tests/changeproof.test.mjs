import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CitationValidator } from '../dist/core/citation_validator.js';
import { AlignmentEngine } from '../dist/core/alignment_engine.js';
import { PlaywrightSynthesizer } from '../dist/core/playwright_synthesizer.js';
import { VideoProcessor } from '../dist/core/video_processor.js';
import { MetaSamAdapter } from '../dist/core/sam_adapter.js';
import { HudVisualizer } from '../dist/core/hud_visualizer.js';
import { RegressionRunner } from '../dist/core/regression_runner.js';
import { SelectorRepairEngine } from '../dist/core/selector_repair_engine.js';
import { BenchmarkRunner } from '../dist/core/benchmark_runner.js';
import { runDemo } from '../dist/cli.js';
import * as path from 'node:path';
import * as fs from 'node:fs';



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

  test('Test 14: HudVisualizer generates standalone HTML report with SAM 3.1 overlays and citations', () => {
    const evidenceHash = CitationValidator.computeEvidenceHash(0, 1000, { x: 50, y: 50, width: 100, height: 40 }, 'click button');
    const step = {
      stepIndex: 1,
      action: 'click',
      targetSelector: 'button#checkout',
      evidence: {
        frameTimestampMs: 1000,
        frameIndex: 0,
        boundingBox: { x: 50, y: 50, width: 100, height: 40 },
        transcriptSpan: { startMs: 900, endMs: 1200, text: 'click button' },
        confidence: 0.95,
        evidenceHash
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const suite = {
      suiteId: 'suite_hud_test',
      testName: 'Visualizer Test Suite',
      baseUrl: 'https://app.test.com',
      generatedAt: '2026-10-28T01:00:00.000Z',
      steps: [step],
      playwrightCode: `await page.click('button#checkout');`
    };

    const keyframes = [{
      frameIndex: 0,
      timestampMs: 1000,
      imageHash: 'hash_0',
      detectedElements: []
    }];

    const html = HudVisualizer.generateReportHtml(suite, keyframes);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('ChangeProof Developer HUD'));
    assert.ok(html.includes('Visualizer Test Suite'));
    assert.ok(html.includes('https://app.test.com'));
    assert.ok(html.includes('100% Cryptographically Grounded'));
    assert.ok(html.includes('SAM 3.1 TARGET'));
    assert.ok(html.includes(evidenceHash.substring(0, 16)));
  });

  test('Test 15: runDemo executes end-to-end checkout demo and returns 100% grounded suite', () => {
    const { suite, hudHtml } = runDemo();

    assert.equal(suite.testName, 'E-Commerce Headset Checkout Flow');
    assert.equal(suite.steps.length, 3);
    assert.ok(suite.playwrightCode.includes('test.describe'));
    assert.ok(suite.playwrightCode.includes('store.meta.com'));
    assert.ok(suite.playwrightCode.includes('Evidence: Frame #0'));
    assert.ok(hudHtml.includes('E-Commerce Headset Checkout Flow'));
    assert.ok(hudHtml.includes('100% Cryptographically Grounded'));
  });

  test('Test 16: Citation pattern matches full 64-char and truncated evidence comments', () => {
    const citationRegex = /\/\/\s*\[Evidence:\s*Frame\s*#\d+\s*@\s*\d+ms\s*\|\s*Box:\s*\(\d+,\d+,\d+x\d+\)\s*\|\s*Hash:\s*[a-f0-9]+(?:\.\.\.)?\]/g;
    
    const sampleCode = `
      // [Evidence: Frame #0 @ 1200ms | Box: (120,80,280x42) | Hash: 5f71b61359d4c2a4985720491823904812039481230491820394812039481234]
      await page.click('button');
      // [Evidence: Frame #1 @ 3500ms | Box: (420,320,160x48) | Hash: aea5bbca590b...]
      await expect(elem).toBeVisible();
    `;

    const matches = sampleCode.match(citationRegex);
    assert.ok(matches);
    assert.equal(matches.length, 2);
  });

  test('Test 17: Evaluates synthesized suite against v1_baseline.html and passes 100% assertions', () => {
    const { suite } = runDemo();
    const baselinePath = path.resolve('fixtures/sample_app/v1_baseline.html');

    const result = RegressionRunner.evaluateSuite(suite, baselinePath);

    assert.equal(result.passed, true);
    assert.equal(result.totalSteps, 3);
    assert.equal(result.passedSteps, 3);
    assert.equal(result.failedStepIndex, undefined);
    assert.equal(result.regressionCaught, undefined);
    assert.ok(result.durationMs >= 0);
  });

  test('Test 18: Evaluates synthesized suite against v2_regression.html and isolates mutated CTA selector', () => {
    const { suite } = runDemo();
    const regressionPath = path.resolve('fixtures/sample_app/v2_regression.html');

    const result = RegressionRunner.evaluateSuite(suite, regressionPath);

    assert.equal(result.passed, false);
    assert.equal(result.failedStepIndex, 2);
    assert.ok(result.regressionCaught);
    assert.ok(result.regressionCaught.includes('elem_add_to_cart'));
    assert.equal(result.passedSteps, 1); // Step 1 passed, Step 2 failed
  });

  test('Test 19: compareReleases generates comprehensive release report and root cause analysis', () => {
    const { suite } = runDemo();
    const baselinePath = path.resolve('fixtures/sample_app/v1_baseline.html');
    const regressionPath = path.resolve('fixtures/sample_app/v2_regression.html');

    const report = RegressionRunner.compareReleases(suite, baselinePath, regressionPath);

    assert.equal(report.suiteName, 'E-Commerce Headset Checkout Flow');
    assert.equal(report.baseline.passed, true);
    assert.equal(report.candidate.passed, false);
    assert.equal(report.regressionDetected, true);
    assert.equal(report.divergentStepIndex, 2);
    assert.ok(report.rootCauseAnalysis.includes('step #2'));
    assert.ok(report.rootCauseAnalysis.includes('elem_add_to_cart'));
  });

  test('Test 20: RegressionRunner detects disabled element regression on click action', () => {
    const sampleHtml = `<div><button id="submit-btn" data-testid="checkout-btn" disabled>Submit</button></div>`;
    const step = {
      stepIndex: 1,
      action: 'click',
      targetSelector: '[data-testid="checkout-btn"]',
      evidence: {
        frameTimestampMs: 1000,
        frameIndex: 0,
        boundingBox: { x: 10, y: 10, width: 100, height: 40 },
        transcriptSpan: { startMs: 500, endMs: 1200, text: 'Click checkout' },
        confidence: 0.95,
        evidenceHash: 'a'.repeat(64)
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const evalResult = RegressionRunner.evaluateStep(step, sampleHtml);

    assert.equal(evalResult.passed, false);
    assert.ok(evalResult.error.includes('disabled in this build'));
  });

  test('Test 21: RegressionRunner detects missing text assertion regression', () => {
    const sampleHtml = `<div class="badge">Order Status: Processing</div>`;
    const step = {
      stepIndex: 1,
      action: 'assert_text',
      targetSelector: '.badge',
      targetValue: 'Order Confirmation #ORD-9821',
      evidence: {
        frameTimestampMs: 2000,
        frameIndex: 1,
        boundingBox: { x: 10, y: 10, width: 100, height: 40 },
        transcriptSpan: { startMs: 1800, endMs: 2200, text: 'Verify order confirmed' },
        confidence: 0.98,
        evidenceHash: 'b'.repeat(64)
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const evalResult = RegressionRunner.evaluateStep(step, sampleHtml);

    assert.equal(evalResult.passed, false);
    assert.ok(evalResult.error.includes('missing from page content'));
  });

  test('Test 22: SelectorRepairEngine.extractCandidates extracts interactive DOM elements and composite selectors', () => {
    const fixtureHtml = fs.readFileSync(path.resolve('fixtures/sample_app/v4_complete_redesign.html'), 'utf-8');
    const candidates = SelectorRepairEngine.extractCandidates(fixtureHtml);

    assert.ok(candidates.length >= 3);
    const searchInput = candidates.find(c => c.dataTestId === 'catalog_query_input');
    assert.ok(searchInput);
    assert.equal(searchInput.tag, 'input');

    const button = candidates.find(c => c.dataTestId === 'action_checkout_headset');
    assert.ok(button);
    assert.equal(button.tag, 'button');
    assert.ok(button.compositeSelector.includes('action_checkout_headset'));
  });

  test('Test 23: SelectorRepairEngine.computeMatchScore scores high confidence for intent, role, and attribute matches', () => {
    const step = {
      stepIndex: 2,
      action: 'click',
      targetSelector: 'button:has-text("Add to Cart"), [data-testid="elem_add_to_cart"]',
      evidence: {
        frameTimestampMs: 3500,
        frameIndex: 1,
        boundingBox: { x: 400, y: 300, width: 150, height: 45 },
        transcriptSpan: { startMs: 3200, endMs: 3800, text: 'Click Add to Cart to purchase the headset' },
        confidence: 0.94,
        evidenceHash: 'c'.repeat(64)
      },
      isDestructive: false,
      requiresOperatorConfirmation: false
    };

    const goodCandidate = {
      tag: 'button',
      dataTestId: 'action_checkout_headset',
      textContent: 'Add Headset to Cart',
      isDisabled: false,
      compositeSelector: '[data-testid="action_checkout_headset"]'
    };

    const { score, reasons } = SelectorRepairEngine.computeMatchScore(step, goodCandidate);
    assert.ok(score >= 0.50);
    assert.ok(reasons.some(r => r.includes('click action')));
    assert.ok(reasons.some(r => r.includes('intent keywords')));
  });

  test('Test 24: SelectorRepairEngine.repairStep generates deterministic SHA-256 repair proof hash', () => {
    const { suite } = runDemo();
    const fixtureHtml = fs.readFileSync(path.resolve('fixtures/sample_app/v4_complete_redesign.html'), 'utf-8');
    const step2 = suite.steps[1];

    const proposal = SelectorRepairEngine.repairStep(step2, fixtureHtml);
    assert.ok(proposal);
    assert.equal(proposal.stepIndex, 2);
    assert.equal(proposal.repairProofHash.length, 64);
    assert.ok(proposal.confidence >= 0.50);
    assert.ok(proposal.repairedSelector.includes('action_checkout_headset'));
  });

  test('Test 25: SelectorRepairEngine.repairSuite heals broken test suite against v4_complete_redesign.html', () => {
    const { suite } = runDemo();
    const fixturePath = path.resolve('fixtures/sample_app/v4_complete_redesign.html');

    // Baseline suite fails on v4 before repair
    const preRepairEval = RegressionRunner.evaluateSuite(suite, fixturePath);
    assert.equal(preRepairEval.passed, false);
    assert.equal(preRepairEval.passedSteps, 0);

    // Run automated self-healing
    const repairResult = SelectorRepairEngine.repairSuite(suite, fixturePath);
    assert.equal(repairResult.totalFailedSteps, 3);
    assert.equal(repairResult.healedStepsCount, 3);
    assert.equal(repairResult.unresolvedStepsCount, 0);

    // Healed suite passes 100% of assertions on the refactored build
    assert.equal(repairResult.validationRun?.passed, true);
    assert.ok(repairResult.healedSuite.playwrightCode.includes('ChangeProof Auto-Heal'));
    assert.ok(repairResult.healedSuite.playwrightCode.includes('Repair Proof:'));
  });

  test('Test 26: SelectorRepairEngine fail-closed integrity: refuses low-confidence repairs on v2_regression.html', () => {
    const { suite } = runDemo();
    const regressionPath = path.resolve('fixtures/sample_app/v2_regression.html');

    const repairResult = SelectorRepairEngine.repairSuite(suite, regressionPath);
    // On v2 (where button is disabled and order badge missing), repair should NOT blindly heal
    assert.equal(repairResult.healedStepsCount, 0);
    assert.equal(repairResult.unresolvedStepsCount, 2);
    assert.equal(repairResult.validationRun?.passed, false);
  });

  test('Test 27: BenchmarkRunner.getStandardScenarios provides 4 distinct enterprise workflows', () => {
    const scenarios = BenchmarkRunner.getStandardScenarios();
    assert.equal(scenarios.length, 4);

    const ids = scenarios.map(s => s.id);
    assert.ok(ids.includes('scenario_checkout'));
    assert.ok(ids.includes('scenario_enterprise_sso'));
    assert.ok(ids.includes('scenario_api_keys'));
    assert.ok(ids.includes('scenario_analytics_dashboard'));

    for (const sc of scenarios) {
      assert.ok(sc.keyframes.length >= 2);
      assert.ok(sc.transcripts.length >= 3);
      assert.ok(sc.baseUrl.startsWith('http'));
    }
  });

  test('Test 28: BenchmarkRunner.runBenchmark achieves 100.0% precision and 0.00% hallucination rate', () => {
    const report = BenchmarkRunner.runBenchmark();

    assert.equal(report.totalSessions, 4);
    assert.equal(report.totalActionsEvaluated, 16);
    assert.equal(report.overallGroundingPrecision, 100.0);
    assert.equal(report.overallHallucinationRate, 0.0);
    assert.equal(report.overallSelfHealingAccuracy, 100.0);
    assert.ok(report.benchmarkId.startsWith('bm_'));
  });

  test('Test 29: BenchmarkRunner measures sub-millisecond average alignment and synthesis latency', () => {
    const report = BenchmarkRunner.runBenchmark();

    assert.ok(report.avgAlignmentLatencyMs < 10.0);
    assert.ok(report.avgSynthesisLatencyMs < 10.0);
    assert.ok(report.avgThroughputActionsPerSec > 100);
  });

  test('Test 30: BenchmarkRunner produces granular per-scenario metrics', () => {
    const report = BenchmarkRunner.runBenchmark();
    assert.equal(report.sessionResults.length, 4);

    const sso = report.sessionResults.find(r => r.sessionId === 'scenario_enterprise_sso');
    assert.ok(sso);
    assert.equal(sso.totalSteps, 5);
    assert.equal(sso.groundedSteps, 5);
    assert.equal(sso.hallucinatedSteps, 0);

    const checkout = report.sessionResults.find(r => r.sessionId === 'scenario_checkout');
    assert.ok(checkout);
    assert.equal(checkout.regressionCaught, true);
    assert.equal(checkout.selfHealingAccuracy, 100);
  });

  test('Test 31: BenchmarkRunner.generateMarkdownSummary generates valid markdown table and SLAs', () => {
    const report = BenchmarkRunner.runBenchmark();
    const md = report.markdownSummary;

    assert.ok(md.includes('# ChangeProof 🛡️ Empirical Benchmark Report'));
    assert.ok(md.includes('Grounding Precision'));
    assert.ok(md.includes('100.0%'));
    assert.ok(md.includes('Hallucination Rate'));
    assert.ok(md.includes('0.00%'));
    assert.ok(md.includes('Scenario-by-Scenario Evaluation'));
    assert.ok(md.includes('scenario_enterprise_sso'));
    assert.ok(md.includes('Mathematical Verification Guarantees'));
  });

});


