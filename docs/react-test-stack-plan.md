# React Test Stack Plan

## Current Status

`react-list-interaction` and `react-text-block` now have real runtime tests.
They are green and useful, but they currently rely on `react-test-renderer`.

That means two things are true at the same time:

- current coverage is materially better than placeholder tests
- the harness is not the long-term target

## Why Change Later

`react-test-renderer` now emits deprecation warnings.
That does not block correctness today, but it is a signal that future React-facing packages should not keep expanding on this base indefinitely.

## Short-Term Baseline

Until a better stack is chosen, keep the current harness for:

- hook contract coverage
- simple render shape assertions
- avoiding a larger test-framework introduction during package-boundary stabilization

In other words:

- keep it for maintenance
- do not keep expanding it as the permanent default

## Next Migration Target

When this repo is ready to upgrade, prefer a stack that supports:

- React 19
- hook testing
- lightweight DOM semantics where needed
- package-level execution without forcing a full app framework

The migration should happen once, not piecemeal per package.

## Suggested Migration Sequence

1. Choose the shared React test harness
2. Migrate `react-list-interaction`
3. Migrate `react-text-block`
4. Reuse that stack for future React-facing extracted packages

## What Not To Do

Do not:

- introduce one-off test harnesses per package
- keep mixing placeholder tests with multiple React test runners
- start `native-command-bridge-core` and a new React adapter before the shared test direction is decided

## Decision Gate

Before adding the next React-facing package, decide whether:

- the current `react-test-renderer` baseline is still acceptable for one more package, or
- the repo should stop and adopt the longer-term React test stack first

Current recommendation:

- acceptable for maintenance only
- not ideal as the base for another new React adapter package
