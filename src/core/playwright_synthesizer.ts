import type { GroundedTestStep, SynthesizedTestSuite } from '../types/schema.js';

export class PlaywrightSynthesizer {
  /**
   * Synthesizes an executable Playwright TypeScript test file with line-by-line evidence citations.
   */
  public static synthesizeSuite(
    testName: string,
    baseUrl: string,
    steps: GroundedTestStep[]
  ): SynthesizedTestSuite {
    const suiteId = `suite_${Date.now()}`;
    const generatedAt = new Date().toISOString();

    const codeLines: string[] = [
      `import { test, expect } from '@playwright/test';`,
      ``,
      `/**`,
      ` * Auto-Synthesized by ChangeProof (Meta Global AI Developer Hackathon)`,
      ` * Suite ID: ${suiteId}`,
      ` * Generated At: ${generatedAt}`,
      ` * Grounded Steps: ${steps.length}`,
      ` */`,
      `test.describe('${testName}', () => {`,
      `  test('execute grounded visual workflow', async ({ page }) => {`,
      `    // Initial navigation`,
      `    await page.goto('${baseUrl}');`,
      ``
    ];

    for (const step of steps) {
      const { evidence } = step;
      const citationComment = `    // [Evidence: Frame #${evidence.frameIndex} @ ${evidence.frameTimestampMs}ms | Box: (${evidence.boundingBox.x},${evidence.boundingBox.y},${evidence.boundingBox.width}x${evidence.boundingBox.height}) | Hash: ${evidence.evidenceHash.substring(0, 12)}...]`;
      const intentComment = `    // Spoken Intent: "${evidence.transcriptSpan.text}"`;

      codeLines.push(citationComment);
      codeLines.push(intentComment);

      switch (step.action) {
        case 'click':
          codeLines.push(`    const target_${step.stepIndex} = page.locator('${step.targetSelector}').first();`);
          codeLines.push(`    await expect(target_${step.stepIndex}).toBeVisible({ timeout: 5000 });`);
          codeLines.push(`    await target_${step.stepIndex}.click();`);
          break;

        case 'fill':
          codeLines.push(`    const input_${step.stepIndex} = page.locator('${step.targetSelector}').first();`);
          codeLines.push(`    await expect(input_${step.stepIndex}).toBeVisible({ timeout: 5000 });`);
          codeLines.push(`    await input_${step.stepIndex}.fill('${step.targetValue || ''}');`);
          break;

        case 'assert_visible':
          codeLines.push(`    await expect(page.locator('${step.targetSelector}').first()).toBeVisible({ timeout: 5000 });`);
          break;

        case 'assert_text':
          codeLines.push(`    await expect(page.locator('${step.targetSelector}').first()).toContainText('${step.targetValue || ''}', { timeout: 5000 });`);
          break;

        case 'navigate':
          codeLines.push(`    await page.goto('${step.targetValue || baseUrl}');`);
          break;

        default:
          codeLines.push(`    // Unsupported action: ${step.action}`);
          break;
      }

      codeLines.push(``);
    }

    codeLines.push(`  });`);
    codeLines.push(`});`);

    const playwrightCode = codeLines.join('\n');

    return {
      suiteId,
      testName,
      baseUrl,
      generatedAt,
      steps,
      playwrightCode
    };
  }
}
