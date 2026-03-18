# AGENTS.md

## Purpose

This file defines how an agent should work in this repository.

Use it as operating guidance, not as a codebase summary.

## 1. Think Before Coding

- Identify the owning package before making changes.
- If a request could apply to both an active path and a legacy path, stop and confirm which one should move forward.
- When a change affects model shape, API shape, or shared types, trace the impact across the full flow instead of patching one layer in isolation.
- Before changing imports or package references, inspect the relevant `tsconfig` and app config files to understand alias resolution.

In this repo, the usual dependency flow is:

`definition -> api-client -> express -> example app`

## 2. Prefer The Smallest Useful Change

- Choose the smallest change that fully solves the user's request.
- Preserve existing package boundaries unless the user explicitly asks for restructuring.
- Avoid introducing new abstractions unless duplication is actively blocking the task.
- Do not refactor naming, folder layout, or architecture as a side quest.

When in doubt, prefer a local fix over a repo-wide cleanup.

## 3. Be Surgical

- Edit only the files needed for the requested outcome.
- Do not "clean up" stale or unfinished areas unless they directly block the task.
- Do not treat similarly named folders as interchangeable.
- If a path looks legacy, incomplete, or disconnected from the active workspace, leave it alone unless the user explicitly targets it.

## 4. Validate With Intent

- Decide how you will verify the change before editing.
- Start with the narrowest meaningful validation.
- Expand verification only when the change affects shared code, public API shape, or multiple packages.
- If automated tests are missing, use builds and focused manual checks instead of pretending coverage exists.

Preferred verification commands:

- Root libraries: `npm run build:all`
- Definition package: `cd packages/libs/common/definition && npm run build`
- API client package: `cd packages/libs/client/api-client && npm run build`
- Express package: `cd packages/libs/server/express && npm run build`
- Example server: `cd examples/pestore/apps/server && npm run build`
- Example client: `cd examples/pestore/apps/client && npm run build`

For manual local checks:

- `npm run example:pet-store:server`
- `npm run example:pet-store:client`

## 5. Active Paths First

Unless the user says otherwise, treat these as the active paths:

- `packages/libs/common/definition`
- `packages/libs/client/api-client`
- `packages/libs/server/express`
- `examples/pestore`

Treat these as non-default targets:

- `packages/server/eecho`
- `packages/libs/definition`

Do not move work into those non-default paths unless the user explicitly wants that direction.

## 6. Alias And Naming Discipline

This repository contains naming drift. Check carefully before editing imports.

Watch for:

- `pestore` vs `pet-store`
- `@petstore/*` vs `@pestore/*`
- `@eecho/express` vs `@eecho/server`
- `packages/libs/common/definition` vs `packages/libs/definition`

Never assume a similarly named path is the correct one.

## 7. Repo-Specific Guardrails

- Prefer `@eecho/express` as the working server path unless the user explicitly asks to develop `@eecho/server`.
- If you modify definitions, inspect downstream generators and example usage.
- If you modify the example server data flow, pay attention to the in-memory Mongo setup in `examples/pestore/apps/server/src/db.ts`.
- If you touch public package behavior, make sure the example app still matches the new usage pattern.

## 8. When Updating This File

- Keep stable decision rules.
- Remove temporary observations once they stop changing agent behavior.
- Add project-specific guidance only when it helps an agent choose correctly between plausible options.
