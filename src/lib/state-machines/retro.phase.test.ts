import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createInitialState,
  transition,
  type RetroCard,
  type RetroState,
} from "./retro.ts";

function facilitatorRoom(): RetroState {
  const base = createInitialState("fac");
  return transition(base, {
    type: "PARTICIPANT_JOIN",
    participant: { id: "fac", name: "Fac", joinedAt: 1 },
  });
}

function card(id: string, text: string): RetroCard {
  return {
    id,
    category: "happy",
    text,
    anonymousId: "anon",
    createdAt: 1,
  };
}

function atPhase(phase: RetroState["phase"], extra: Partial<RetroState> = {}): RetroState {
  return { ...facilitatorRoom(), phase, ...extra };
}

describe("grouping and naming are one step", () => {
  it("renames a theme during grouping and advances to voting", () => {
    let state = atPhase("grouping", {
      cards: [card("c1", "shipping got faster")],
      groups: [
        { id: "g1", label: "shipping got faster", cardIds: ["c1"], voteCount: 0 },
      ],
    });
    state = transition(state, {
      type: "RENAME_GROUP",
      groupId: "g1",
      label: "Release pace",
      facilitatorId: "fac",
    });
    assert.equal(state.groups[0]?.label, "Release pace");
    state = transition(state, { type: "ADVANCE_PHASE", facilitatorId: "fac" });
    assert.equal(state.phase, "voting");
    assert.equal(state.groups[0]?.label, "Release pace");
  });

  it("names a leftover card when leaving the group step", () => {
    let state = atPhase("grouping", {
      cards: [card("c1", "the deploy runbook is stale")],
      groups: [],
    });
    state = transition(state, { type: "ADVANCE_PHASE", facilitatorId: "fac" });
    assert.equal(state.phase, "voting");
    assert.equal(state.groups.length, 1);
    assert.equal(state.groups[0]?.label, "the deploy runbook is stale");
  });

  it("lets an old labeling room rename, move, and advance", () => {
    let state = atPhase("labeling", {
      cards: [card("c1", "one"), card("c2", "two")],
      groups: [{ id: "g1", label: "one", cardIds: ["c1"], voteCount: 0 }],
      cardPositions: { c2: { x: 10, y: 10 } },
    });
    state = transition(state, {
      type: "RENAME_GROUP",
      groupId: "g1",
      label: "Named in the old step",
      facilitatorId: "fac",
    });
    assert.equal(state.groups[0]?.label, "Named in the old step");
    state = transition(state, {
      type: "MOVE_CARD_POSITION",
      cardId: "c2",
      x: 40,
      y: 40,
    });
    assert.equal(state.phase, "labeling");
    state = transition(state, { type: "ADVANCE_PHASE", facilitatorId: "fac" });
    assert.equal(state.phase, "voting");
    assert.equal(state.cardPositions.c2?.x, 40);
  });
});

describe("discussion clock", () => {
  it("stores a length inside the range and ignores one outside it", () => {
    let state = atPhase("discussing");
    state = transition(state, {
      type: "SET_TIMER",
      facilitatorId: "fac",
      seconds: 120,
    });
    assert.equal(state.discussion.timerSeconds, 120);
    assert.equal(state.discussion.timerRemaining, 120);
    const rejected = transition(state, {
      type: "SET_TIMER",
      facilitatorId: "fac",
      seconds: 90 * 60,
    });
    assert.equal(rejected.discussion.timerSeconds, 120);
  });

  it("ignores a timer change before discussion", () => {
    const state = atPhase("grouping");
    const next = transition(state, {
      type: "SET_TIMER",
      facilitatorId: "fac",
      seconds: 120,
    });
    assert.equal(next.discussion.timerSeconds, 300);
  });
});
