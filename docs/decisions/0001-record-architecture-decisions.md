# 0001. Record architecture decisions

- Status: accepted
- Date: 2026-01-01

## Context

The repository is maintained by a small team and by coding agents. Choices about the diff algorithm,
the rendering strategy and the dependency policy are easy to forget and easy to re-litigate.

## Decision

We record every architectural decision as a numbered Markdown file in `docs/decisions/`, named
`NNNN-title.md`. Each record states the context, the decision, the alternatives considered and the
consequences. Records are immutable once accepted; a later decision supersedes an earlier one by
reference instead of editing it.

## Alternatives

- A single free-form `NOTES.md`: cheap to write, but impossible to link to a specific decision.
- Decisions only in pull request descriptions: lost as soon as the conversation is archived.

## Consequences

- The rationale behind the tokenizer, the `maxCells` budget and the script-free renderer stays
  discoverable.
- The documentation check requires at least one file matching `docs/decisions/NNNN-*.md`, so the
  directory cannot silently disappear.
