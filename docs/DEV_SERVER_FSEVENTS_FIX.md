# Fix: `fsevents.watch is not a function` in dev server

## Context
- Error appears after `react-scripts start` succeeds but crashes at runtime.
- Stack trace points to `watchpack` → `chokidar` → `fsevents-handler`.
- Environment: macOS + Node 22.

## Root Cause
An outdated `fsevents` v1 dependency is pulled in by the dependency tree. Node 22 expects the modern API, and v1 does not implement `fsevents.watch`, causing a runtime failure when file watching starts.

## Strategy Applied
1. **Standardize Node version**
   - Use Node 22 (via `nvm use 22`).
2. **Clean reinstall**
   - Remove `node_modules` and `package-lock.json`.
   - Reinstall dependencies with `npm install`.
3. **Force modern `fsevents`**
   - Add an `overrides` block in `package.json` to pin `fsevents` to v2:
     - `"overrides": { "fsevents": "^2.3.3" }`
   - Run `npm install` again to apply the override.

## Result
- Dev server starts without crashing.
- File watching works correctly on macOS with Node 22.

## Notes
- This project still uses `react-scripts@4`, which brings older transitive dependencies. The override is the safest minimal fix without upgrading the toolchain.
- If the issue returns, verify the active Node version and re-run `npm install` to ensure the override is applied.
