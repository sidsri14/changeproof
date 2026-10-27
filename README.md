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

## 4. Verification & Testing

ChangeProof features a complete automated test suite:
- **8/8 automated tests passing**:
  - Deterministic SHA-256 evidence hashing
  - Bounding box dimension enforcement
  - Rejection of tampered evidence hashes
  - Low-confidence detection pruning
  - Multimodal temporal alignment
  - Playwright `.spec.ts` synthesis with line-by-line citation comments
  - Full end-to-end alignment, validation, and code synthesis

### Run Tests:
```bash
npm install
npm run build
npm test
```

### Run Demonstration:
```bash
npm run demo
```

---

## 5. License
MIT License. Created for the Meta Global AI Developer Hackathon.
