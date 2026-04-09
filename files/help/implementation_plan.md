# Headless Polytrack Physics Simulator Implementation Plan

The goal is to create a standalone Node.js script that simulates a race on a given track with a given input string and returns the finish time, using the game's original physics engine (Ammo.js) via a headless browser.

## User Review Required

> [!IMPORTANT]
> The simulation will run in a headless Chromium instance (Puppeteer). This is necessary because the physics engine (Ammo.js) is a complex WASM-based system that is difficult to replicate outside of the game's original environment.

> [!NOTE]
> The script will be designed to run as fast as possible by bypassing rendering and running the physics loop at 1000 FPS (the game's internal physics rate).

## Proposed Changes

### Research and Preparation
- Verify the exact minified names for key classes and methods in `dist/bundle.js`.
- Confirm how to properly initialize the `Ammo` physics world headlessly.

### Components

#### [NEW] [simulate.js](file:///c:/Users/liney/Downloads/Polytrack/files/simulate.js)
The entry point script for the user.
- Handles CLI arguments: `inputString`, `upperConstraint`, `trackPath`.
- Starts a temporary local HTTP server to serve game files.
- Launches Puppeteer (headless).
- Injects a "Headless Monitor" script into the page.
- Reports the result to stdout.

#### [NEW] [headless_worker.js](file:///c:/Users/liney/Downloads/Polytrack/files/headless_worker.js)
The script injected into the headless browser.
- Intercepts the game's `Ammo().then(...)` initialization.
- Loads the track from the provided data.
- Initializes the physics world and the car.
- Loads the replay input string.
- Runs a tight loop:
  - `stepSimulation(1/1000, 0, 1/1000)`
  - Update car controls from replay.
  - Check for finish line crossing.
- Communicates back to `simulate.js` via `window.__finishTime`.

## Open Questions

- **Track Materials**: Does `Au.fromSaveString` require a specific materials object that is globally available or should it be constructed?
- **Finish Detection**: The game checks finish every 10 frames by default. For higher precision, should I check every frame or stick to the game's 10-frame logic?

## Verification Plan

### Automated Tests
- Build a test suite that runs a known replay on a known track and verifies the output matches the known finish time.
- Verify that `upperConstraint` correctly returns -1 when valid but slow.

### Manual Verification
- Run the script with various track/input combinations and compare with in-game results if possible.
