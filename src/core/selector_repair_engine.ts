/**
 * ChangeProof: Self-Healing Visual Selector Recovery Engine
 * Meta Global AI Developer Hackathon ($1,000,000 Aggregate Prize Pool)
 * 
 * Autonomously repairs broken selectors caused by frontend refactoring,
 * DOM mutations, and style updates using visual intent heuristics,
 * attribute alignment, and cryptographic migration proofs.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { 
  GroundedTestStep, 
  SynthesizedTestSuite, 
  CandidateElement, 
  SelectorRepairProposal, 
  SuiteRepairResult,
  BoundingBox
} from '../types/schema.js';
import { RegressionRunner } from './regression_runner.js';
import { PlaywrightSynthesizer } from './playwright_synthesizer.js';

export class SelectorRepairEngine {
  /**
   * Parses HTML snapshot and extracts candidate targetable elements.
   */
  public static extractCandidates(html: string): CandidateElement[] {
    const candidates: CandidateElement[] = [];

    // Strip scripts and styles first so their contents don't pollute text
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Match each tag: <tag attributes> optional inner text
    const tagRegex = /<([a-z0-9_-]+)\b([^>]*)>(?:([^<]*)(?:<\/\1>)?)?/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(cleanHtml)) !== null) {
      const tag = match[1].toLowerCase();
      const rawAttrs = match[2] || '';
      const directText = (match[3] || '').trim();

      if (['html', 'head', 'body', 'meta', 'link', 'br', 'hr', 'title'].includes(tag)) {
        continue;
      }

      const idMatch = rawAttrs.match(/\bid=["']([^"']+)["']/i);
      const classMatch = rawAttrs.match(/\bclass=["']([^"']+)["']/i);
      const testidMatch = rawAttrs.match(/\bdata-testid=["']([^"']+)["']/i);
      const ariaMatch = rawAttrs.match(/\baria-label=["']([^"']+)["']/i);
      const valueMatch = rawAttrs.match(/\bvalue=["']([^"']+)["']/i);
      const placeholderMatch = rawAttrs.match(/\bplaceholder=["']([^"']+)["']/i);
      const isDisabled = /\bdisabled\b/i.test(rawAttrs);

      const id = idMatch ? idMatch[1] : undefined;
      const className = classMatch ? classMatch[1] : undefined;
      const dataTestId = testidMatch ? testidMatch[1] : undefined;
      const ariaLabel = ariaMatch ? ariaMatch[1] : undefined;
      const textContent = directText || (valueMatch ? valueMatch[1] : (placeholderMatch ? placeholderMatch[1] : ''));

      // Keep if it has attributes or text
      if (dataTestId || ariaLabel || id || textContent || tag === 'button' || tag === 'input') {
        const selectorParts: string[] = [];
        if (dataTestId) selectorParts.push(`[data-testid="${dataTestId}"]`);
        if (ariaLabel) selectorParts.push(`[aria-label="${ariaLabel}"]`);
        if (id) selectorParts.push(`#${id}`);
        if (textContent.length > 0 && textContent.length < 40 && tag === 'button') {
          selectorParts.push(`button:has-text("${textContent}")`);
        } else if (textContent.length > 0 && textContent.length < 40 && (tag === 'div' || tag === 'span' || tag === 'h1' || tag === 'h2' || tag === 'h3')) {
          selectorParts.push(`${tag}:has-text("${textContent.replace(/[\r\n\t]+/g, ' ').trim()}")`);
        }

        const compositeSelector = selectorParts.length > 0 ? selectorParts.join(', ') : `${tag}${id ? '#' + id : ''}`;

        candidates.push({
          tag,
          id,
          className,
          dataTestId,
          ariaLabel,
          textContent,
          isDisabled,
          compositeSelector
        });
      }
    }

    return candidates;
  }

  /**
   * Computes a similarity and suitability score between a broken test step and a candidate DOM element.
   */
  public static computeMatchScore(step: GroundedTestStep, candidate: CandidateElement): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Tag & Action Affinity
    if (step.action === 'click') {
      if (['button', 'a', 'input'].includes(candidate.tag)) {
        score += 0.25;
        reasons.push(`Tag '${candidate.tag}' aligns with click action`);
      } else if (candidate.dataTestId?.includes('btn') || candidate.className?.includes('btn')) {
        score += 0.20;
        reasons.push(`Class/TestID contains 'btn' click intent`);
      }
    } else if (step.action === 'fill') {
      if (candidate.tag === 'input' || candidate.tag === 'textarea') {
        score += 0.35;
        reasons.push(`Tag '${candidate.tag}' directly accepts text input`);
      }
    } else if (step.action === 'assert_text' || step.action === 'assert_visible') {
      score += 0.25;
      reasons.push(`Element is visible in DOM for assertion`);
    }

    // 2. Spoken Intent & Text Content Overlap
    const transcriptText = step.evidence.transcriptSpan.text.toLowerCase();
    const candidateText = (candidate.textContent + ' ' + (candidate.ariaLabel || '')).toLowerCase();
    
    // Extract informative keywords (skip small stop words)
    const keywords = transcriptText
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'click', 'verify', 'screen', 'displayed'].includes(w));

    let matchedKeywords = 0;
    for (const kw of keywords) {
      if (candidateText.includes(kw)) {
        matchedKeywords++;
      }
    }

    if (keywords.length > 0 && matchedKeywords > 0) {
      const textMatchRatio = matchedKeywords / keywords.length;
      const boost = Math.min(0.40, textMatchRatio * 0.40);
      score += boost;
      reasons.push(`Matched ${matchedKeywords}/${keywords.length} intent keywords in text/aria-label (+${boost.toFixed(2)})`);
    }

    // 3. TestID / Attribute Stem Overlap
    const origSelector = step.targetSelector.toLowerCase();
    if (candidate.dataTestId) {
      const candTestId = candidate.dataTestId.toLowerCase();
      // Tokenize selector stems
      const stems = ['buy', 'cart', 'search', 'checkout', 'order', 'badge', 'error', 'btn', 'submit', 'query', 'input', 'confirmation'];
      for (const stem of stems) {
        if (origSelector.includes(stem) && candTestId.includes(stem)) {
          score += 0.30;
          reasons.push(`Shared semantic attribute stem '${stem}' (+0.30)`);
          break;
        }
      }
    }

    // 4. Action Specific Value Check
    if (step.action === 'assert_text' && step.targetValue) {
      if (candidate.textContent.includes(step.targetValue)) {
        score += 0.45;
        reasons.push(`Exact targetValue '${step.targetValue}' present in candidate text (+0.45)`);
      }
    }

    // 5. Action Context Penalties
    if (step.action === 'click' && candidate.isDisabled) {
      score -= 0.15;
      reasons.push(`Target is disabled in regressed build (-0.15)`);
    }

    const finalScore = Math.min(1.0, Math.max(0.0, Math.round(score * 100) / 100));
    return { score: finalScore, reasons };
  }

  /**
   * Attempts to heal a single failed test step against an HTML snapshot.
   */
  public static repairStep(
    step: GroundedTestStep,
    html: string,
    minConfidence = 0.50
  ): SelectorRepairProposal | null {
    const candidates = this.extractCandidates(html);
    if (candidates.length === 0) return null;

    let bestCandidate: CandidateElement | null = null;
    let bestScore = -1;
    let bestReasons: string[] = [];

    for (const candidate of candidates) {
      // Don't repair to an identical broken selector
      if (candidate.compositeSelector === step.targetSelector) {
        continue;
      }

      const { score, reasons } = this.computeMatchScore(step, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
        bestReasons = reasons;
      }
    }

    if (bestCandidate && bestScore >= minConfidence) {
      const repairProofHash = crypto
        .createHash('sha256')
        .update(`${step.evidence.evidenceHash}:${bestCandidate.compositeSelector}:${Date.now()}`)
        .digest('hex');

      return {
        stepIndex: step.stepIndex,
        originalSelector: step.targetSelector,
        repairedSelector: bestCandidate.compositeSelector,
        confidence: bestScore,
        reasons: bestReasons,
        matchedElement: bestCandidate,
        repairProofHash
      };
    }

    return null;
  }

  /**
   * Evaluates a test suite against a candidate release, identifies broken selectors,
   * synthesizes self-healed replacements, and validates the repaired suite.
   */
  public static repairSuite(
    suite: SynthesizedTestSuite,
    candidateHtmlOrPath: string,
    minConfidence = 0.50
  ): SuiteRepairResult {
    const initialEval = RegressionRunner.evaluateSuite(suite, candidateHtmlOrPath);
    const candidatePath = initialEval.fixturePath;

    let html = candidateHtmlOrPath;
    if (candidateHtmlOrPath.endsWith('.html') || candidateHtmlOrPath.endsWith('.htm')) {
      html = fs.readFileSync(path.resolve(candidateHtmlOrPath), 'utf-8');
    }

    const failedSteps = initialEval.stepResults.filter(r => !r.passed);
    const repairs: SelectorRepairProposal[] = [];
    const repairedSteps: GroundedTestStep[] = [];

    for (const originalStep of suite.steps) {
      const failure = failedSteps.find(f => f.stepIndex === originalStep.stepIndex);

      if (failure) {
        const proposal = this.repairStep(originalStep, html, minConfidence);

        if (proposal) {
          repairs.push(proposal);
          // Create healed step
          repairedSteps.push({
            ...originalStep,
            targetSelector: proposal.repairedSelector
          });
        } else {
          // Keep original step if unrepairable
          repairedSteps.push(originalStep);
        }
      } else {
        // Step passed cleanly
        repairedSteps.push(originalStep);
      }
    }

    // Synthesize healed suite with migration annotations
    const healedSuiteBase = PlaywrightSynthesizer.synthesizeSuite(
      `${suite.testName} (ChangeProof Self-Healed)`,
      suite.baseUrl,
      repairedSteps
    );

    // Inject migration comments for repaired steps
    let codeWithMigrationProofs = healedSuiteBase.playwrightCode;
    for (const repair of repairs) {
      const annotation = `    // [ChangeProof Auto-Heal: Repaired Step #${repair.stepIndex} | Original: '${repair.originalSelector}' -> Healed: '${repair.repairedSelector}' | Confidence: ${repair.confidence.toFixed(2)} | Repair Proof: ${repair.repairProofHash}]\n`;
      const stepTargetStr = `const target_${repair.stepIndex} =`;
      if (codeWithMigrationProofs.includes(stepTargetStr)) {
        codeWithMigrationProofs = codeWithMigrationProofs.replace(stepTargetStr, `${annotation}    ${stepTargetStr}`);
      }
    }

    const healedSuite: SynthesizedTestSuite = {
      ...healedSuiteBase,
      playwrightCode: codeWithMigrationProofs
    };

    // Re-validate healed suite against the candidate build
    const postRepairEval = RegressionRunner.evaluateSuite(healedSuite, html);
    healedSuite.validationRun = {
      passed: postRepairEval.passed,
      durationMs: postRepairEval.durationMs,
      regressionCaught: postRepairEval.regressionCaught
    };

    return {
      suiteId: `repaired_${Date.now()}`,
      originalSuiteName: suite.testName,
      repairedAt: new Date().toISOString(),
      totalFailedSteps: failedSteps.length,
      healedStepsCount: repairs.length,
      unresolvedStepsCount: failedSteps.length - repairs.length,
      repairs,
      healedSuite,
      validationRun: {
        passed: postRepairEval.passed,
        durationMs: postRepairEval.durationMs
      }
    };
  }
}
