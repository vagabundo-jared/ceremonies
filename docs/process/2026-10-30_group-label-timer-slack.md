# Group, name, time, and post to Slack
Date · branch group-label-timer-slack · no PR · process step 1 of 1
## Problem
A facilitator running a retro on this fork has to finish grouping, then advance into a separate labeling step before anyone can name a theme. The discussion clock exists in the room state and is not on the screen, and its length cannot be changed from the retro. When the retro ends, the summary stays in the browser. Nothing reaches Slack.
## Requirements
1. Grouping and naming are one step. While that step is open, people can move cards and the facilitator can name each theme. The next step is voting. [confirmed: user, 2026-10-30, "grouping and labeling should be the same step and enabled"]
2. A room already sitting in the old labeling step can still move cards, rename themes, and advance to voting. [inferred: those rooms exist in saved party state; dropping the step must not freeze them]
3. During discussion the room shows a clock. The facilitator sets its length, from 1 minute through 60 minutes, and starts or pauses it. Everyone sees the same remaining time. [confirmed: user, "customizable clock timer"; the 1 to 60 minute range is assumed]
4. The facilitator can save a Slack incoming webhook on the room. The URL is not shown to other people and is not written into the retro record. When the retro closes, the server posts the themes, vote counts, and action items to that hook. A bad URL is rejected and does not replace a saved hook. [confirmed: user, "a slack hook"; the incoming-webhook shape and the close-time post are assumed]
5. A failed Slack post does not block closing the retro. The facilitator sees whether the post succeeded. [inferred: a hook outage should not trap the room]
## Acceptance criteria
- [x] AC1 From the group step, the facilitator names a theme without advancing, and the next advance lands on voting. Observed in the state-machine unit test.
- [x] AC2 A room whose phase is the old labeling step accepts a rename and a card move, and one advance reaches voting. Observed in the state-machine unit test.
- [x] AC3 The facilitator sets the discussion clock to 2 minutes and to 90 minutes. 2 minutes is stored. 90 minutes is ignored. Observed in the state-machine unit test.
- [x] AC4 A Slack incoming webhook URL is accepted. Any other URL is rejected. The close message names each theme, its vote count, and its action items. Observed in the slack-hook unit test.
- [x] AC5 The group screen says the team groups and names themes in this step, and the discussion screen shows the clock controls. Observed in the browser on the local preview.
- [ ] AC6 Works on staging with real data, checked in the browser. Open. This fork has no staging deploy. Jared has not walked it.
## Testing criteria
- unit: `node --experimental-strip-types --test src/lib/state-machines/retro.phase.test.ts src/lib/slack-hook.test.ts`
- lint: `npx eslint` on the files this step changes
- build: `npx tsc --noEmit -p party` and `npx tsc --noEmit` if the app config allows it
- headless: local preview at http://localhost:3456, open a retro room, confirm the group step copy and the discussion clock after walking the phases in the browser
- staging: none. The last acceptance criterion stays open.
## Out of scope
Renaming the Happy, Sad, and Confused columns. The verbatim and synthesized downloads in WANTED.md. A Slack app install, slash command, or events subscription. Posting the webhook URL into the database.
## Results
Run on 2026-10-30 against the local preview (Next on :3456, party server on :1999).
- unit: 9 of 9 pass. This adds one test: Slack text is escaped so a card cannot ping the channel.
- build: `tsc --noEmit -p party` and `tsc --noEmit` are clean.
- lint: 0 errors. The changed files have fewer warnings than the committed code. The `exhaustive-deps` warning on `safePositions` in grouping-phase.tsx was already there.
- headless: `tests/retro-group-clock.mjs` passes 6 of 6 checks. `tests/retro-slack-hook.mjs` passes 6 of 6 checks. Neither script closes a retro, so no message went to a real Slack channel.
- staging: not run. AC6 stays open.
## Refactor decision
Review fixes made after the first pass:
- Escape `&`, `<` and `>` in theme names, card text, action text and assignees before the Slack post.
- Keep the last Slack post result in party storage and send it in the join sync. Before this, a facilitator who reloaded the closed screen saw "Waiting for the Slack result" with no end.
- Read `cardPositions` in the drag handler again, so the hook does not depend on an object made on every render.
- End `tests/retro-slack-hook.mjs` with an explicit exit. The open socket kept the process alive.
No further refactor. The old `labeling` phase stays in the type so that saved rooms still load.
## Next
The column rename and the two exports in WANTED.md.
