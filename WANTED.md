# Wanted

This fork is the base for a retrospective I can run with a team. The source is [mshadmanrahman/ceremonies](https://github.com/mshadmanrahman/ceremonies), forked on 2026-10-30. This file is the work list. It is not a claim that any of the work below has been built.

## The retro

1. A kanban with three columns: what went right, what needs improvement, and action items.
2. Group the cards into named themes.
3. Vote.
4. A decision guide produced from those votes.
5. Two exports of the same retro: a verbatim record, and a synthesis.

## Already in this fork

Checked against `main` at `9d67db6` on 2026-10-30.

- The writing phase has three columns. They are hardcoded as Happy, Sad, and Confused. See `CardCategory` in `src/lib/state-machines/retro.ts`, the `retro_cards.category` enum in `src/lib/db/schema.ts`, and the column list in `src/components/retro/writing-phase.tsx`.
- Grouping exists. The phases are `grouping` and `labeling`. Cards cluster by proximity in `computeProximityGroups`, and a facilitator can create a group, move a card into it, and rename it. The screen is a canvas, not a stack of themes on the kanban.
- Votes exist. A participant votes on a group, with a per-person cap. `rankGroups` sorts by `voteCount` and drops every group whose count is 0, so those groups never enter the discussion order.
- Action items exist as their own records, created during discuss and commit, and attached to a group. They are not a writing column. The Haunting phase reads them back at the next retro.
- Closing the retro copies a text summary and downloads a CSV. Both cover action items, topic labels, and vote counts. Neither includes the card text. The copy is built in `src/app/(app)/retro/[id]/retro-room-client.tsx`. The CSV helper is `src/lib/csv.ts`.

## Work to do

1. Rename the three writing columns to "What went right", "What needs improvement", and "Action items". Keep The Haunting. It depends on the `action_items` rows that the save route writes when a retro closes.
2. Keep theme grouping on the group model that is already there (`CardGroup`, `CREATE_GROUP`, `MOVE_CARD_TO_GROUP`, `RENAME_GROUP`). A theme has a name and the cards in it. Do not add a second grouping model.
3. Keep the existing group votes.
4. Add a decision guide computed from the votes. Rank every theme by vote count. Keep themes that received no votes and mark them not decided. Under each theme, list its cards and its action items. A sentence in the guide has to point at a card or a vote count.
5. Add two downloads of the closed retro.
   - Verbatim: every card, its column, its theme, the vote count on that theme, and the action items.
   - Synthesized: the decision guide, written out, with the same trace back to a card or a vote count.

## Leave alone

Estimation, billing, Jira, Clerk, and the PartyServer room. The phase order stays: write, group, vote, discuss, close.

## Provenance

The "already in this fork" section was read from the files named above at commit `9d67db6`. The five outcomes are the requested product. The note about zero-vote groups is an inference from `rankGroups`, which filters with `voteCount > 0`.
