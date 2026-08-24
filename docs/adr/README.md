# Architecture Decision Records

Each significant, hard-to-reverse decision gets a numbered record here: the context it
was made in, the decision, the alternatives that were considered and rejected, and the
consequences we accepted. The point is that a future contributor (human or AI) can see
_why_ things are the way they are without re-litigating settled questions.

Rules:

- An architecturally significant change lands **with a new ADR in the same PR**.
- ADRs are immutable history: to reverse one, write a new ADR that supersedes it and
  link the two — don't edit the old record's decision.
- Keep each record to a page or less.

Template: `NNNN-short-title.md` with sections **Status** (Accepted/Superseded + date),
**Context**, **Decision**, **Alternatives considered**, **Consequences**.

## Index

| #    | Decision                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| 0001 | [No UI framework — plain DOM and inline SVG](0001-no-ui-framework.md)                                                 |
| 0002 | [The domain layer is pure TypeScript](0002-pure-domain-layer.md)                                                      |
| 0003 | [Levelness is a height tolerance in mm, not degrees](0003-height-based-tolerance.md)                                  |
| 0004 | [The repository is text-only; binary assets are generated](0004-text-only-repository.md)                              |
| 0005 | [CSP is delivered via a meta tag](0005-csp-via-meta-tag.md)                                                           |
| 0006 | [Feedback via pre-filled GitHub issue URL, no backend](0006-feedback-without-backend.md)                              |
| 0007 | [GitHub Pages doubles as QA; candidate builds are X.Y.CR&lt;PR&gt;](0007-pages-as-qa-and-versioning.md)               |
| 0008 | [Caravan mode: the axle is the reference, the jockey is bidirectional](0008-caravan-vehicle-model.md)                 |
| 0009 | [A boggie is one leveling axle at its midpoint, with paired wheels](0009-boggie-as-midpoint-axle.md)                  |
| 0010 | [Two-layer calibration: sensor offset + vehicle zero, stored decomposed](0010-two-layer-calibration.md)               |
| 0011 | [Ramp advice is a plan for the ramps the user owns](0011-ramp-plan-for-owned-ramps.md)                                |
| 0012 | [Appearance is a second preset axis, independent of light/dark theme](0012-appearance-preset-independent-of-theme.md) |
