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

# 2. Synthesize Playwright spec and Developer HUD from session JSON:
node dist/cli.js synthesize --input session.json --url https://shop.com --out spec.ts --hud hud.html

# 3. Cryptographically verify SHA-256 evidence citations in a spec:
node dist/cli.js verify --spec demo/demo_checkout.spec.ts

# 4. Generate standalone Developer HUD report:
node dist/cli.js hud --input session.json --out developer_hud.html
```

### Developer HUD Visualizer:
The standalone HTML report provides a zero-dependency interactive dashboard featuring:
- SVG bounding-box overlays for detected SAM 3.1 UI elements
- Spoken user intent & transcription timing
- Cryptographic SHA-256 evidence citations for every test assertion
- Synthesized Playwright code with line-by-line grounding

---

## 5. Verification & Testing

ChangeProof features a complete automated test suite (**16/16 automated tests passing in <15ms**):
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

### Run Tests:
```bash
npm run build
npm test
```

---

## 6. License
MIT License. Created for the Meta Global AI Developer Hackathon.
