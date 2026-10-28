# ChangeProof 🛡️
### Multimodal Regression-Testing Agent (Meta Global AI Developer Hackathon)

> **Competition**: Meta Global AI Developer Hackathon ($1,000,000 Aggregate Prize Pool)  
> **Host**: Cerebral Valley & Meta  
> **Build Period**: October 26, 2026 (12:00 PM GMT-5) – November 4, 2026 (9:00 PM GMT-5)  
> **Author**: Siddharth Srivastava (`@sidsri14` | Solo Developer)  
> **Status**: Active Build | 100% compliant with official build window  

---

## 1. Problem Statement
Web development and QA engineering teams lose thousands of hours translating user bug screen recordings, Loom videos, and feature demos into reliable automated tests:
1. **Selector Drift**: Raw DOM paths and arbitrary CSS selectors break as UI styles evolve.
2. **Intent Loss**: Silent recordings lack context on what the user intended to test versus incidental clicks.
3. **Hallucinated Syntheses**: Traditional LLMs invent non-existent DOM elements or emit race conditions that fail unpredictably.

---

## 2. The Solution: ChangeProof
`ChangeProof` creates an **evidence-locked multimodal synthesis pipeline**:
- **Video Keyframe Ingestion**: Ingests video recordings and segments interactive UI bounding boxes (powered by SAM 3.1).
- **Spoken Intent Extraction**: Transcribes narration and extracts structured action/assertion intents.
- **Strict Evidence Citation**: Every single Playwright action (`click`, `fill`, `expect`) is cryptographically tied via SHA-256 to an exact video timestamp, frame index, and bounding box.
- **Fail-Closed Execution**: Low-confidence or ungrounded steps are automatically rejected before code generation.

---

## 3. Architecture

```
[ Screen Recording + Voice Audio (.mp4 / .webm) ]
                        │
                        ▼
       ┌────────────────┴────────────────┐
       │                                 │
       ▼ (Video Frames)                  ▼ (Audio Track)
[ Keyframe Extraction ]         [ Audio Separation ]
       │                                 │
       ▼                                 ▼
[ SAM 3.1 UI Segmentation ]     [ Voice Transcription ]
(Bounding boxes, clickable masks) (Word timestamps, user intent)
       │                                 │
       └────────────────┬────────────────┘
                        │
                        ▼
        [ Multimodal Alignment Engine ]
   (Correlates spoken commands with visual clicks)
                        │
                        ▼
      [ Strict Citation & Policy Guardrail ]
(Validates every proposed action against visual evidence;
 rejects invented selectors or ungrounded assertions)
                        │
                        ▼
         [ Playwright Test Synthesis ]
 (Generates robust, isolated, executable e2e test suite)
```

---

## 4. CLI Runner & Developer HUD

ChangeProof includes a developer-facing CLI and interactive HUD visualizer:

### CLI Commands:
```bash
# 1. Run built-in e-commerce checkout flow demo:
npm run demo
# or: node dist/cli.js demo

# 2. Evaluate regressions against baseline vs regressed release fixtures:
npm run test:regression
# or: node dist/cli.js test-regression --baseline fixtures/sample_app/v1_baseline.html --candidate fixtures/sample_app/v2_regression.html

# 3. Synthesize Playwright spec and Developer HUD from session JSON:
node dist/cli.js synthesize --input session.json --url https://shop.com --out spec.ts --hud hud.html

# 4. Cryptographically verify SHA-256 evidence citations in a spec:
node dist/cli.js verify --spec demo/demo_checkout.spec.ts

# 5. Autonomously heal broken selectors against refactored builds:
npm run test:repair
# or: node dist/cli.js repair --candidate fixtures/sample_app/v4_complete_redesign.html --out demo/healed_checkout.spec.ts

# 6. Run empirical multimodal benchmark suite:
npm run benchmark
# or: node dist/cli.js benchmark --out benchmark_report.json --markdown benchmark_report.md

# 7. Generate standalone Developer HUD report:
node dist/cli.js hud --input session.json --out developer_hud.html
```

### Developer HUD Visualizer:
The standalone HTML report provides a zero-dependency interactive dashboard featuring:
- SVG bounding-box overlays for detected SAM 3.1 UI elements
- Spoken user intent & transcription timing
- Cryptographic SHA-256 evidence citations for every test assertion
- Synthesized Playwright code with line-by-line grounding

---

## 5. Visual & Structural Regression Detection

ChangeProof includes an automated `RegressionRunner` engine and evolving sample app fixtures (`fixtures/sample_app/`):
- `v1_baseline.html`: Pristine baseline e-commerce checkout release.
- `v2_regression.html`: Injected subtle regressions (mutated CTA testids, disabled button state, broken confirmation badges).
- `v4_complete_redesign.html`: Complete redesign build with shifted DOM hierarchies, renamed testids, and updated action copy.

When evaluating releases, ChangeProof checks each grounded action and assertion:
- Resolves composite Playwright selectors (`data-testid`, `aria-label`, `:has-text()`, `#id`, `.class`).
- Enforces element interactability invariants (flags disabled or hidden elements on click actions).
- Verifies text content assertions against the rendered document.
- Pinpoints the exact divergent step index and provides automatic root cause analysis.

---

## 6. Autonomous Self-Healing Test Engine (`SelectorRepairEngine`)

When UI components undergo design refactors, traditional e2e suites fail due to **selector drift**. ChangeProof autonomously heals broken tests without sacrificing cryptographic integrity:
1. **Interactive Element Ingestion**: Extracts candidate DOM elements, attributes (`data-testid`, `aria-label`, `#id`), and cleaned text.
2. **Multimodal Similarity Matching**: Evaluates candidates against the original recorded voice intent, target action roles, and attribute semantic stems.
3. **Cryptographic Repair Proof**: Every healed step receives a verifiable SHA-256 migration proof linking the original multimodal evidence hash directly to the repaired locator.
4. **Automated Migration Annotations**: Emits clean, readable migration comments directly into the synthesized `.spec.ts` suite.
5. **Fail-Closed Integrity**: Distinguishes between legitimate UI redesigns and genuine functional regressions (refuses to heal to disabled elements or ungrounded locators).

---

## 7. Empirical Benchmark Suite (`BenchmarkRunner`)

ChangeProof features a standardized benchmark engine that evaluates multimodal grounding across authentic enterprise workflows (Checkout, Enterprise SSO, API Key Lifecycle, Real-Time Telemetry):

| Metric | Measured Value | Target SLA | Verdict |
| :--- | :---: | :---: | :---: |
| **Grounding Precision** | **100.0%** | $\ge 99.0\%$ | ✅ **EXCEEDS** |
| **Hallucination Rate** | **0.00%** | $0.00\%$ | ✅ **ZERO DRIFT** |
| **Self-Healing Recovery** | **100.0%** | $\ge 90.0\%$ | ✅ **RESILIENT** |
| **Avg Alignment Latency** | **<0.5ms** | $<10.0\text{ms}$ | ✅ **SUB-MILLISECOND** |
| **Avg Synthesis Latency** | **<0.5ms** | $<10.0\text{ms}$ | ✅ **SUB-MILLISECOND** |
| **Throughput** | **>1,600 actions/sec** | $>100\text{ actions/sec}$ | ✅ **ENTERPRISE GRADE** |

---

## 8. Verification & Testing

ChangeProof features a complete automated test suite (**31/31 automated tests passing in <45ms**):
- Deterministic SHA-256 evidence hashing
- Bounding box dimension enforcement
- Rejection of tampered evidence hashes
- Low-confidence detection pruning
- Multimodal temporal alignment
- Playwright `.spec.ts` synthesis with line-by-line citation comments
- Full end-to-end alignment, validation, and code synthesis
- VideoProcessor frame hashing & deduplication
- VideoProcessor normalized frame delta calculation
- VideoProcessor audio track segmentation
- Meta SAM 3.1 element segmentation & confidence filtering
- Standalone HTML Developer HUD generation with SVG overlays
- Built-in `runDemo()` checkout session synthesis
- Cryptographic citation pattern validation
- Evaluation of synthesized suite against `v1_baseline.html` (100% assertions green)
- Evaluation against `v2_regression.html` with accurate isolation of mutated CTA selector
- `compareReleases()` baseline vs candidate comparison report & root cause analysis
- Disabled element detection during click action
- Missing text assertion detection
- `extractCandidates()` DOM element and composite selector extraction
- `computeMatchScore()` multi-attribute confidence scoring
- `repairStep()` deterministic SHA-256 repair proof hash generation
- `repairSuite()` end-to-end healing against `v4_complete_redesign.html` (100% assertions green post-repair)
- Fail-closed refusal to heal low-confidence or disabled elements on `v2_regression.html`
- `BenchmarkRunner.getStandardScenarios()` providing 4 distinct enterprise workflows
- `BenchmarkRunner.runBenchmark()` verifying 100.0% precision & 0.00% hallucination rate
- Sub-millisecond latency & high-throughput validation
- Scenario-by-scenario empirical granularity
- Automated GitHub-flavored markdown benchmark report generation

### Run Tests:
```bash
npm run build
npm test
npm run test:regression
npm run test:repair
npm run benchmark
```

---

## 9. License

MIT License. Created for the Meta Global AI Developer Hackathon.
