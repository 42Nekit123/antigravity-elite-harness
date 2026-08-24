---
name: code-review
description: Multi-angle review of the current diff (or a specified branch/commit/file) for correctness bugs and cleanup opportunities. Use when the user asks to review, audit, or sanity-check a change before it's committed, merged, or handed off. Produces a ranked, verified list of findings — not a rewrite.
---

`7 finder angles (up to 6 candidates each) → 1-pass verify (CONFIRMED / PLAUSIBLE / REFUTED) → ≤10 findings`

You are reviewing for **recall**: catch every real bug a careful reviewer
would catch in one sitting. At this stage, surfacing a plausible bug is
better than staying silent about it. False positives get filtered in Phase 2,
not by self-censoring in Phase 1.

## Phase 0 — Get the diff

Run, via `run_command`:

```
git diff @{upstream}...HEAD
```

If there's no upstream, fall back to `git diff main...HEAD` or
`git diff HEAD~1`. If uncommitted changes exist (`git status` shows a dirty
tree) or the range diff is empty, also run `git diff HEAD` and include the
working-tree changes — review usually happens before the commit, not after.

If the user passed a specific target (PR number, branch name, or file path),
review that instead and treat it as the scope for every phase below.

## Phase 1 — Find candidates

Run each angle below. You may do this directly with `grep_search` /
`view_file`, or fan the angles out in parallel by calling `define_subagent`
once per angle (read-only tools only: `view_file`, `grep_search`,
`find_by_name`, `run_command` restricted to read-only commands) and
`invoke_subagent` to run them concurrently. Each angle returns **up to 6**
candidates, each with `file`, `line`, a one-line `summary`, and a concrete
`failure_scenario` — the specific input/state/timing that triggers it.

Pass every candidate with a nameable failure scenario forward, even ones
you're only half-sure about — a finder that quietly drops weak candidates
skips the verification step entirely and is the main source of missed bugs.

### A — Line-by-line scan
Read every hunk. For hunks inside a function, `view_file` the whole
enclosing function — a bug in an unchanged line of a touched function is
still in scope if the diff re-exposes it or fails to fix it. For each
changed line, ask what input, state, timing, or platform makes it wrong:
inverted conditions, off-by-one, missing null/undefined check, a dropped
`await`, a falsy-zero treated as absent, a copy-pasted variable, an error
swallowed in a catch block, an unescaped regex metacharacter.

### B — Removed-behavior audit
For every line the diff deletes or replaces, name the invariant or guard it
was enforcing, then `grep_search` the new code for where that invariant is
re-established. If you can't find it, that's a candidate — a dropped
validation, a narrowed error path, a deleted test that covered a real case.

### C — Cross-file impact
For each function/method the diff changes, `grep_search` its name to find
callers. Check whether the change breaks any call site: a new precondition,
a changed return shape, a newly-thrown exception, a new ordering dependency.
Also check callees the changed function calls — does a parallel change
elsewhere in the same diff make that call unsafe now?

### D — Reuse
Flag new code in the diff that re-implements something the codebase already
has. `grep_search` shared/util directories and files adjacent to the change;
name the existing helper that should be called instead.

### E — Simplification & efficiency
Flag complexity or waste the diff adds: redundant state that could be
derived, deep nesting, dead code left behind, repeated I/O or computation
that could be hoisted or cached, independent operations run sequentially
that could run concurrently, blocking work added to a hot path or startup.
Also flag closures/objects that capture more of their enclosing scope than
they need — if that object outlives the call, it keeps everything it closed
over alive too. Name the leaner alternative for each.

### F — Architectural fit ("altitude")
Check whether each change is implemented at the right layer. A special case
bolted onto shared infrastructure to handle one caller's needs is a sign the
underlying mechanism should be generalized instead. Flag fixes that patch a
symptom at the call site rather than the root cause in the shared code.

### G — Conventions (AGENTS.md)
Find every `AGENTS.md` that governs the changed files: the repo-root one,
plus any in a directory that is an ancestor of a changed file (an
`AGENTS.md` only governs files at or below its own directory). `view_file`
each one that exists, then check the diff against the rules it states. Only
flag a violation you can back with an exact quote from the rule and the
exact line that breaks it — no vibes-based "spirit of the doc" calls. If no
`AGENTS.md` applies to the changed files, return nothing for this angle.

For angles D–G, use the same `file`/`line`/`summary` shape as A–C, but in
`failure_scenario` state the concrete cost instead of a crash: what's
duplicated, what's wasted, what gets harder to maintain, or which exact
`AGENTS.md` rule is broken. Correctness findings (A–C) always outrank D–G
when the 10-finding cap forces a cut.

## Phase 2 — Verify

Dedup near-duplicates first (same defect, same location, same root cause →
keep one). For each remaining candidate, do one focused verification pass —
either yourself or via a single `invoke_subagent` call per candidate — with
the diff, the relevant file(s), and the candidate in context. Classify it as
exactly one of:

- **CONFIRMED** — you can point to the exact line(s) that prove the bug
  fires under the stated scenario.
- **PLAUSIBLE** — realistic under conditions you can't fully rule in or out
  from the diff alone: concurrency races, a rare-but-reachable path (error
  handler, cold cache, an optional field that's sometimes absent), a
  falsy-zero treated as missing, a boundary the code doesn't explicitly
  exclude, a retry/partial-failure interaction, a regex/allowlist missing an
  anchor. Default here when in doubt — don't demand certainty Phase 1 can't
  give you.
- **REFUTED** — only when you can construct the disproof: the claim is
  factually wrong (quote the actual line), provably impossible given a
  type/constant/invariant (show it), already handled elsewhere in this same
  diff (cite the guard), or pure style with zero observable effect.

Keep CONFIRMED and PLAUSIBLE. Drop REFUTED, and drop it silently — don't
pad the output explaining why something isn't a bug.

## Output

Return at most 10 findings, most severe first, correctness (A–C) ranked
above cleanup/altitude/conventions (D–G):

```json
[
  {
    "file": "path/to/file.ext",
    "line": 123,
    "angle": "A",
    "confidence": "CONFIRMED",
    "summary": "one-sentence statement of the problem",
    "failure_scenario": "concrete input/state -> wrong output or crash"
  }
]
```

If nothing survives Phase 2, return `[]` and say so plainly — don't invent a
minor nitpick just to have something to show.

## Optional flags

- `--fix` — after presenting findings, apply fixes for the CONFIRMED ones to
  the working tree via `replace_file_content`, one finding per call, and
  re-run the narrowest relevant check (test/build/lint) after each. Leave
  PLAUSIBLE findings unfixed and flagged for the user to confirm.
- `--effort=low|medium|high` — low/medium: run angles A–C and G only, keep
  only CONFIRMED plus high-confidence PLAUSIBLE, cap at 5. high (default):
  all seven angles, cap at 10, as above.
