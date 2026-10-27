/**
 * ChangeProof: Regression Evaluation Engine
 * Meta Global AI Developer Hackathon ($1,000,000 Aggregate Prize Pool)
 * 
 * Evaluates synthesized Playwright test suites and multimodal assertions
 * against web application HTML fixtures to detect visual and structural regressions.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GroundedTestStep, SynthesizedTestSuite } from '../types/schema.js';

export interface RegressionStepEvaluation {
  stepIndex: number;
  action: string;
  selector: string;
  passed: boolean;
  matchedSelector?: string;
  error?: string;
  evidenceHash: string;
}

export interface RegressionEvaluationResult {
  passed: boolean;
  fixturePath?: string;
  durationMs: number;
  totalSteps: number;
  passedSteps: number;
  failedStepIndex?: number;
  regressionCaught?: string;
  stepResults: RegressionStepEvaluation[];
}

export interface ReleaseComparisonReport {
  suiteName: string;
  baseline: {
    path?: string;
    passed: boolean;
    durationMs: number;
  };
  candidate: {
    path?: string;
    passed: boolean;
    durationMs: number;
  };
  regressionDetected: boolean;
  divergentStepIndex?: number;
  rootCauseAnalysis?: string;
}

export class RegressionRunner {
  /**
   * Matches a Playwright selector (or composite comma-separated selectors) against HTML.
   */
  public static matchesSelector(html: string, compositeSelector: string): { matched: boolean; matchedSubSelector?: string; isElementDisabled?: boolean } {
    // Split candidate selectors (e.g. button:has-text("X"), [aria-label="X"], [data-testid="X"])
    const candidates = compositeSelector.split(/,\s*(?![^()]*\))/).map(s => s.trim()).filter(Boolean);

    for (const candidate of candidates) {
      // 1. Check data-testid attribute: [data-testid="value"]
      const testidMatch = candidate.match(/\[data-testid=["']([^"']+)["']\]/);
      if (testidMatch) {
        const idVal = testidMatch[1];
        const regex = new RegExp(`data-testid=["']${escapeRegex(idVal)}["']([^>]*)`, 'i');
        const tagMatch = html.match(regex);
        if (tagMatch) {
          const attributesAfter = tagMatch[1] || '';
          const isDisabled = /\bdisabled\b/i.test(attributesAfter);
          return { matched: true, matchedSubSelector: candidate, isElementDisabled: isDisabled };
        }
      }

      // 2. Check aria-label attribute: [aria-label="value"]
      const ariaMatch = candidate.match(/\[aria-label=["']([^"']+)["']\]/);
      if (ariaMatch) {
        const ariaVal = ariaMatch[1];
        const regex = new RegExp(`aria-label=["']${escapeRegex(ariaVal)}["']([^>]*)`, 'i');
        const tagMatch = html.match(regex);
        if (tagMatch) {
          const attributesAfter = tagMatch[1] || '';
          const isDisabled = /\bdisabled\b/i.test(attributesAfter);
          return { matched: true, matchedSubSelector: candidate, isElementDisabled: isDisabled };
        }
      }

      // 3. Check button:has-text("value") or :has-text("value")
      const textMatch = candidate.match(/(?:(\w+):)?has-text\(["']([^"']+)["']\)/i);
      if (textMatch) {
        const tag = textMatch[1] || '[a-z0-9_-]+';
        const searchPhrase = textMatch[2];
        const tagRegex = new RegExp(`<${tag}[^>]*>(?:(?!<\\/${tag}>)[\\s\\S])*?${escapeRegex(searchPhrase)}[\\s\\S]*?<\\/${tag}>`, 'i');
        const elementFound = html.match(tagRegex);
        if (elementFound) {
          const fullTagStr = elementFound[0];
          const isDisabled = /\bdisabled\b/i.test(fullTagStr);
          return { matched: true, matchedSubSelector: candidate, isElementDisabled: isDisabled };
        }
      }

      // 4. Check tag#id or #id
      const idMatch = candidate.match(/^(?:(\w+))?#([a-z0-9_-]+)$/i);
      if (idMatch) {
        const tag = idMatch[1] || '[a-z0-9_-]+';
        const idVal = idMatch[2];
        const regex = new RegExp(`<${tag}[^>]*id=["']${escapeRegex(idVal)}["']([^>]*)`, 'i');
        const tagMatch = html.match(regex);
        if (tagMatch) {
          const attributesAfter = tagMatch[1] || '';
          const isDisabled = /\bdisabled\b/i.test(attributesAfter);
          return { matched: true, matchedSubSelector: candidate, isElementDisabled: isDisabled };
        }
      }

      // 5. Check tag.class or .class
      const classMatch = candidate.match(/^(?:(\w+))?\.([a-z0-9_-]+)$/i);
      if (classMatch) {
        const tag = classMatch[1] || '[a-z0-9_-]+';
        const classVal = classMatch[2];
        const regex = new RegExp(`<${tag}[^>]*class=["'][^"']*\\b${escapeRegex(classVal)}\\b[^"']*["']([^>]*)`, 'i');
        const tagMatch = html.match(regex);
        if (tagMatch) {
          const attributesAfter = tagMatch[1] || '';
          const isDisabled = /\bdisabled\b/i.test(attributesAfter);
          return { matched: true, matchedSubSelector: candidate, isElementDisabled: isDisabled };
        }
      }
    }

    return { matched: false };

  }

  /**
   * Evaluates a single grounded test step against an HTML snapshot.
   */
  public static evaluateStep(step: GroundedTestStep, html: string): RegressionStepEvaluation {
    const selectorResult = this.matchesSelector(html, step.targetSelector);

    if (!selectorResult.matched) {
      return {
        stepIndex: step.stepIndex,
        action: step.action,
        selector: step.targetSelector,
        passed: false,
        error: `Target selector '${step.targetSelector}' could not be resolved in the HTML DOM.`,
        evidenceHash: step.evidence.evidenceHash
      };
    }

    if (step.action === 'click' && selectorResult.isElementDisabled) {
      return {
        stepIndex: step.stepIndex,
        action: step.action,
        selector: step.targetSelector,
        matchedSelector: selectorResult.matchedSubSelector,
        passed: false,
        error: `Action 'click' failed: Target element '${selectorResult.matchedSubSelector}' is disabled in this build.`,
        evidenceHash: step.evidence.evidenceHash
      };
    }

    if (step.action === 'assert_text' && step.targetValue) {
      if (!html.includes(step.targetValue)) {
        return {
          stepIndex: step.stepIndex,
          action: step.action,
          selector: step.targetSelector,
          matchedSelector: selectorResult.matchedSubSelector,
          passed: false,
          error: `Assertion 'assert_text' failed: Target string '${step.targetValue}' missing from page content.`,
          evidenceHash: step.evidence.evidenceHash
        };
      }
    }

    return {
      stepIndex: step.stepIndex,
      action: step.action,
      selector: step.targetSelector,
      matchedSelector: selectorResult.matchedSubSelector,
      passed: true,
      evidenceHash: step.evidence.evidenceHash
    };
  }

  /**
   * Evaluates an entire synthesized test suite against an HTML snapshot or file path.
   */
  public static evaluateSuite(
    suite: SynthesizedTestSuite,
    htmlOrPath: string
  ): RegressionEvaluationResult {
    const startTime = performance.now();
    let html = htmlOrPath;
    let fixturePath: string | undefined;

    if (htmlOrPath.endsWith('.html') || htmlOrPath.endsWith('.htm')) {
      fixturePath = path.resolve(htmlOrPath);
      html = fs.readFileSync(fixturePath, 'utf-8');
    }

    const stepResults: RegressionStepEvaluation[] = [];
    let passed = true;
    let failedStepIndex: number | undefined;
    let regressionCaught: string | undefined;

    for (const step of suite.steps) {
      const result = this.evaluateStep(step, html);
      stepResults.push(result);

      if (!result.passed && passed) {
        passed = false;
        failedStepIndex = step.stepIndex;
        regressionCaught = `Step #${step.stepIndex} [${step.action}] failed against visual evidence: ${result.error}`;
      }
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const passedSteps = stepResults.filter(r => r.passed).length;

    return {
      passed,
      fixturePath,
      durationMs,
      totalSteps: suite.steps.length,
      passedSteps,
      failedStepIndex,
      regressionCaught,
      stepResults
    };
  }

  /**
   * Compares baseline vs. candidate release builds to isolate visual regressions.
   */
  public static compareReleases(
    suite: SynthesizedTestSuite,
    baselineHtmlOrPath: string,
    candidateHtmlOrPath: string
  ): ReleaseComparisonReport {
    const baseline = this.evaluateSuite(suite, baselineHtmlOrPath);
    const candidate = this.evaluateSuite(suite, candidateHtmlOrPath);

    const regressionDetected = baseline.passed && !candidate.passed;
    let rootCauseAnalysis: string | undefined;

    if (regressionDetected && candidate.failedStepIndex !== undefined) {
      const failedStep = suite.steps.find(s => s.stepIndex === candidate.failedStepIndex);
      rootCauseAnalysis = `Visual regression caught at step #${candidate.failedStepIndex} (${failedStep?.action || 'unknown'}). ` +
        `Baseline release satisfies all multimodal evidence assertions, but candidate release diverged: ${candidate.regressionCaught}`;
    }

    return {
      suiteName: suite.testName,
      baseline: {
        path: baseline.fixturePath,
        passed: baseline.passed,
        durationMs: baseline.durationMs
      },
      candidate: {
        path: candidate.fixturePath,
        passed: candidate.passed,
        durationMs: candidate.durationMs
      },
      regressionDetected,
      divergentStepIndex: candidate.failedStepIndex,
      rootCauseAnalysis
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
