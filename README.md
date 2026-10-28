# ChangeProof

[![ChangeProof CI](https://github.com/sidsri14/changeproof/actions/workflows/ci.yml/badge.svg)](https://github.com/sidsri14/changeproof/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Status: deterministic, offline session-to-spec prototype for the Meta Global AI
> Developer Hackathon. Real Meta inference, raw recording ingestion, speech
> recognition, and browser execution have not been verified in the evidence
> reviewed. This is not a final-submission-ready integration.

ChangeProof turns **already structured keyframe metadata and transcript text**
into Playwright-style TypeScript test code. It also checks selected properties
against local HTML fixtures and proposes selector replacements using text and
attribute heuristics.

See [Integration status and evidence limits](docs/INTEGRATION_STATUS.md) before
using the demo, reports, or generated assets as application or judging evidence.

## What works in the current prototype

- Aligns supplied transcript segments with the nearest supplied keyframe and
  matches targets using labels, IDs, and simple text heuristics.
- Computes SHA-256 checksums over frame index, timestamp, bounding-box coordinates,
  and transcript text; validates those metadata fields and minimum confidence.
- Generates Playwright-style `.spec.ts` source and an illustrative HTML HUD.
- Checks supported selector patterns and text against static HTML fixture
  strings. These checks do not launch a browser, perform clicks, or compare pixels.
- Proposes selector changes from HTML attributes and text, then rechecks them
  against the same static fixture representation.
- Runs 34 automated unit/fixture tests. Passing them is not evidence of live SAM
  inference, speech recognition, real-video understanding, or browser E2E success.

## What is not implemented or verified

- The CLI does not decode `.mp4` or `.webm`, extract audio, or run speech-to-text.
  Its session input is JSON containing keyframes, detections, and transcript text.
  `VideoProcessor` accepts already decoded byte buffers and supplied transcripts.
- `MetaSamAdapter` is an experimental adapter/stub. Its default path manufactures
  geometric boxes and fixed confidence values; these are not model predictions.
  The configurable HTTP path sends an image hash, timestamp, and prompt points,
  not image pixels. No official Meta endpoint/protocol or successful real-model
  run has been validated in the evidence reviewed. It silently falls back to
  the stub after HTTP errors, so a successful return does not prove live inference.
- `@playwright/test` is referenced in generated source but is not installed or
  executed by this repository's test/benchmark workflow.
- Metadata checksum consistency does not establish image authenticity, model
  provenance, selector correctness, or a zero-hallucination guarantee. The hash
  does not bind the selector or image contents.
- The optional CLI `verify` command recognizes citation-shaped comments using a
  regular expression; it does not recompute their hashes or authenticate a
  recording. Treat its current success text as format recognition only.

## Install and check

Requires Node.js 20 or later.

```powershell
npm ci
npm run typecheck
npm run build
npm test
npm run test:regression
npm run test:repair
```

The regression and repair commands exercise local HTML fixtures. A reported
fixture failure is the intentionally injected regression, not a browser run.
Test and CLI commands can write generated demo/report files; use a scratch clone
when existing outputs must be preserved.

## CLI examples

```powershell
# Built-in synthetic session; writes example source and HUD files.
npm run demo

# Use externally prepared structured metadata, not a raw recording.
node dist/cli.js synthesize --input session.json --url https://example.com --out spec.ts --hud hud.html

# Citation-comment format recognition only, not cryptographic verification.
node dist/cli.js verify --spec spec.ts

# Local synthetic-fixture timing and metadata-consistency report.
npm run benchmark
```

`session.json` supplies `keyframes` and `transcripts`; the CLI does not infer
those fields from media.

## How to interpret the benchmark

The bundled benchmark contains four hardcoded synthetic scenarios with 16 emitted
steps. Its legacy “grounding precision” and “hallucination rate” fields count
metadata-validator passes/failures on those emitted steps; they are **not**
accuracy measurements against independently labeled video or model outputs.
Only the checkout scenario has regression/redesign fixtures for the repair check.

Timing and throughput values cover local in-memory alignment, source generation,
and fixture checks. They exclude model inference, media decoding, transcription,
network latency, and browser execution. They are not production SLAs or
enterprise-readiness evidence. Detailed limits are in the integration-status file.

## Presentation assets need reconciliation

The current generated benchmark reports, HUD/playground HTML, submission dossier,
and their source generators still contain unreconciled SAM, confidence, SLA, or
self-healing presentation claims. The static playground's repair interaction is a
scripted text replacement, not an invocation of the repair engine. The video
script is a guarded draft and must not be recorded or submitted unchanged.

`npm run pack` currently regenerates those legacy claims and overwrites generated
assets. Do not use its output as proof of live integration or submission readiness.
The files are retained for further factual reconciliation, not as verified claims.

## License

MIT. Author: Siddharth Srivastava (`sidsri14`).
