# Integration status and evidence limits

Audit date: October 28, 2026. Scope: the current repository's source, tests,
CLI workflow, generated drafts, and local fixture checks. This is a source-based
capability audit, not proof of event eligibility or a completed submission.

## Current status

ChangeProof is an offline, deterministic prototype that consumes structured
session metadata, emits Playwright-style source, and evaluates static HTML
fixtures. No verified real Meta inference, raw-recording ingestion, speech
recognition, or browser E2E execution is established by the evidence reviewed.
CI success verifies the configured unit/fixture workflow only.

## Capability and evidence boundaries

| Area | Current implementation | Evidence still needed before making the broader claim |
| --- | --- | --- |
| Recording input | `src/cli.ts` reads JSON with supplied keyframes/detections/transcripts; `runDemo()` hardcodes them. | A real recording, actual decoding/extraction path, and reproducible output tied to that input. |
| Frame processing | `src/core/video_processor.ts` hashes supplied byte buffers and deduplicates equal hashes. | Verified extraction from an actual media file; no decoder is currently wired into the CLI. |
| Speech | `segmentAudioTrack()` trims transcript strings supplied by the caller. | Actual audio extraction and speech-to-text output with provenance. No ASR model is currently invoked. |
| SAM / Meta | `src/core/sam_adapter.ts` defaults to fixed geometric boxes and fixed scores. Its generic HTTP path sends `imageHash`, timestamps, and points, but no pixels; any HTTP error silently returns the geometric stub. | Official compatible endpoint/model/protocol verification; actual image input; sanitized successful request/response evidence; explicit distinction between live and stub results. No successful official Meta-model run is verified here. |
| Test generation | `PlaywrightSynthesizer` emits TypeScript source referencing `@playwright/test`. | Installation and actual execution of the generated suite against a controlled application, with browser results. The current package/workflow does not perform this execution. |
| Regression checks | `RegressionRunner` uses regular expressions and string checks over HTML fixtures. | Browser interaction, DOM/rendering semantics, event effects, or pixel comparison before claiming visual/browser E2E verification. |
| Repair | `SelectorRepairEngine` scores HTML candidates using tags, text, and attribute stems, then rechecks static fixtures. | Independent functional verification and broader adverse cases before claiming safe general-purpose autonomous repair. A heuristic score is not calibrated model confidence. |
| Presentation UI | `demo_asset_generator.ts` renders a synthetic SVG and swaps a prepared code string when the repair button is clicked. | A clearly labeled simulation, or real engine invocation with displayed observed results. The current hardcoded 94%/95% labels are illustrative, not measured SAM/repair confidence. |

The historical `MetaSamAdapter` class name and SAM labels do not establish that
the shown detections came from a Meta model. Returning data successfully after
silent fallback is also not live-inference evidence. Do not use a provider key
to test the current adapter against a guessed endpoint.

## What the hashes and verify command establish

`CitationValidator.computeEvidenceHash()` in `src/core/citation_validator.ts`
hashes frame index, timestamp, bounding-box coordinates, and transcript text.
It does not hash image bytes, the keyframe's `imageHash`, the selected locator,
the action, or a trusted model response. A caller can change a selector while
the metadata checksum still validates. These are consistency checks over
caller-supplied metadata, not authenticity attestations or proof that a selector
exists in a screenshot or application.

The CLI `verify` path in `src/cli.ts` only finds citation-shaped comments using a
regular expression. It does not recompute hashes, load an evidence manifest,
authenticate recording contents, or verify every generated action. Its current
success wording overstates what it checks and requires later reconciliation.

## Fixture benchmark: exact interpretation

`src/core/benchmark_runner.ts` defines four hardcoded synthetic scenarios and
16 emitted steps. It counts all emitted steps in a scenario as grounded when
the suite's metadata validator passes, and otherwise counts them as invalid.
There is no independent real-video ground truth or real-model prediction set.
Steps omitted during alignment are not counted as failed expected actions.

Consequently:

- The legacy `overallGroundingPrecision` field is a fixture metadata-validation
  result, not measured visual grounding accuracy.
- The legacy `overallHallucinationRate` field is derived from the same check,
  not an LLM hallucination-rate measurement or zero-hallucination guarantee.
- Only the checkout scenario has regression/redesign fixture paths. The bundled
  100% self-healing summary comes from that one fixture case, not four independent
  successful browser repairs or general repair reliability.
- Alignment/synthesis timings and aggregate throughput cover a small local
  in-memory run. They exclude media processing, inference, transcription,
  network calls, and browser execution. No production SLA, percentile latency,
  enterprise-grade capacity, or model-speed claim follows from these numbers.
- The current report generator emits fixed success verdicts and broad guarantees;
  those labels are not a valid evaluator of arbitrary results.

The 34 automated tests verify code and fixtures, including output strings and
geometric-stub behavior. They do not establish successful Meta API use or real
browser execution. Passing CI must not be described as either.

## Drafts that must not be treated as final evidence

The existing generated `benchmark_report.json`, `benchmark_report.md`,
`demo/demo_hud.html`, `demo/playground.html`, `docs/index.html`, and
`docs/SUBMISSION_DOSSIER.md` have unreconciled presentation claims. These files
already had local modifications at audit time and were intentionally preserved.
Their source generators also still need factual copy/provenance reconciliation;
running `npm run pack` can regenerate the unsupported wording.

`demo/video_presentation_script.md` is marked DO NOT RECORD OR SUBMIT. Its older
body is retained as an unverified draft, not approved narration. In particular,
the static preview's asserted 55%-to-95% confidence improvement is not a measured
repair result, and sub-two-millisecond/general production claims are unsupported.

## Remaining gates before any final integration/submission claim

1. Verify the current official event rules and which real Meta technology use
   must be evidenced; do not infer eligibility from this repository or CI.
2. Establish a real, officially compatible model/media path and preserve
   sanitized provenance, or accurately disclose the prototype's narrower scope.
   There must be no silent substitution of synthetic output as model evidence.
3. Run generated tests in a controlled real browser before claiming browser E2E
   success. Preserve the input, output, commands, and actual results.
4. Reconcile generated UI/report/dossier copy and source generators without
   overwriting user-owned changes. Review any narration before recording.
5. Keep CAPTCHA, identity checks, event/legal attestations, credit claims,
   payment-card setup, and billing commitments with the user. If account setup
   or a provider key is required, handle it privately; never paste credentials
   into chat, public source, reports, or logs. No new provider calls or financial
   commitments were made in this audit.

These are outstanding evidence and implementation boundaries, not a statement
that the project is eligible, rejected, submitted, or ready for final judging.
