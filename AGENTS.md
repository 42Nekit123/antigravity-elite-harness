# AGENTS.md — Global Engineering Rules

These rules apply on every step of every task in this repository, inside every
`<user_rules>` injection. They take precedence over generic default behavior.
They do NOT override an explicit instruction the user gives in the current
turn — if the user asks you to break a rule here, do it, but say so.

---

## 1. No Shortcuts, No Special-Casing

A fix that only handles the one input you saw fail is not a fix — it's a
landmine for the next input.

- Before writing a conditional that carves out an exception, ask: *does the
  underlying function/class already have a general mechanism this input
  should have gone through?* If yes, fix that mechanism instead of bolting on
  a branch.
- If you catch yourself writing `if (id === 'the-one-that-broke')` or
  equivalent, stop. That is a special case, not a fix.
- Prefer widening a precondition, fixing a boundary check, or correcting a
  data transform over adding a new `if` that only exists to dodge one
  symptom.
- If a proper fix is out of scope for the task, say so explicitly in your
  final summary instead of silently shipping the narrow patch.

## 2. Match the Repo, Not Your Defaults

Before writing new code in a file or module you haven't touched yet:

1. `view_file` at least one neighboring file that does something similar.
2. Match its naming conventions, error-handling style, import ordering,
   comment density, and test structure — even where they differ from what
   you'd choose by default.
3. Check for a linter/formatter config (`.eslintrc`, `pyproject.toml`,
   `.editorconfig`, etc.) via `find_by_name` and respect it; don't reformat
   files outside your diff.
4. If the repo is inconsistent with itself, follow the convention used in
   the file(s) you're editing, not a repo-wide average.

## 3. Don't Touch What Wasn't Asked

- Don't create new files, new abstractions, new config, or new dependencies
  unless the task requires them. A "nice to have" refactor belongs in a
  separate, explicitly-approved step.
- Don't rename, move, or delete files as a side effect of an unrelated
  change.
- Preserve existing comments and docstrings unrelated to your change unless
  the user says otherwise.
- If you notice an unrelated bug while working, name it in your summary —
  don't fix it inline and don't ignore it.

## 4. Epistemic Honesty

- Never invent a file path, function signature, package name, config key, or
  API shape. If you're not certain it exists, check it — `grep_search` or
  `view_file` — before you reference it in code or in what you tell the
  user.
- Never claim a command succeeded, a test passed, or a file was created
  without having actually run/checked it in this session.
- If you're inferring rather than verifying ("this probably follows the same
  pattern as X"), say so, don't present it as confirmed fact.
- Cite what you looked at. When you tell the user "this repo does X", you
  should be able to name the file and line that shows it.

## 5. Verify Before You Claim

- After any code change, run the narrowest command that can prove it works
  (unit test, type check, linter, or a minimal repro script) via
  `run_command`. Don't rely on reading the diff and reasoning that it "looks
  right."
- Before referencing a symbol, path, or API you didn't just write yourself,
  confirm it exists with `grep_search` / `find_by_name` rather than trusting
  memory or the model's prior training.
- If a verification step isn't available (no test framework, no way to run
  it locally), say that explicitly instead of asserting confidence you don't
  have.

## 6. Honest Failure Reporting

- If a test fails, a build breaks, or a command errors, report the exact
  error — don't paraphrase it into something that sounds better, and don't
  quietly retry until it happens to pass without understanding why.
- Never comment out, skip, or loosen a failing test/assertion to make a run
  go green. Fix the cause, or tell the user the test is failing and why you
  believe it's a pre-existing/unrelated failure.
- If you run out of ideas or hit a wall, say "I'm stuck, here's what I tried
  and what I know" rather than shipping something you're not confident in
  silently.

## 7. Proactive Defaults Over Question Spam

- When a requirement is ambiguous but a reasonable default exists (naming,
  file location, minor UX detail, library choice already used elsewhere in
  the repo), pick the default, state it in one line, and proceed.
- Reserve actual blocking questions for choices that are expensive to
  reverse (schema/API shape, deleting data, architectural direction,
  anything touching auth/payments/security).
- Never ask more than one clarifying question at a time. Prefer proceeding
  with a stated assumption over stopping to ask.

## 8. Tool Discipline (Antigravity-specific)

- `run_command`: no `cd` — set the working directory via the `Cwd`
  parameter. Never chain unrelated commands with `&&` in a way that hides
  which step actually failed; run them separately when you need to know.
- `replace_file_content`: keep each call to one contiguous block. Don't use
  it to make several unrelated edits in the same file in one call — separate
  calls are easier to verify and to revert individually.
- `write_to_file`: only for genuinely new files, or full-file rewrites the
  user asked for. Prefer `replace_file_content` for targeted edits to
  existing files so the diff stays minimal and reviewable.
- Before editing any file, `view_file` the exact line range you intend to
  touch in the current call — don't edit from a stale mental model of the
  file if you edited it earlier in the session and haven't re-viewed it.
- Skills: if a `SKILL.md` is relevant to the current task, read it in full
  with `view_file` before proceeding, and follow it exactly.

## 9. Planning-Mode Discipline

For anything that isn't a trivial one-off change (see Antigravity's own
planning-mode rules for what warrants a plan):

- During Research, make zero source-code or state-mutating changes.
  Read-only tools only.
- Put open questions and design trade-offs *inside* `implementation_plan.md`
  — don't interrogate the user turn-by-turn for things that belong in the
  plan document.
- Don't start Execution before the user has explicitly approved the plan.
- Keep `task.md` current as you work — mark items `[/]` when started, `[x]`
  when verified done, not just written.
